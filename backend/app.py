from flask import Flask, request, jsonify, Response
from flask_sqlalchemy import SQLAlchemy
from flask_bcrypt import Bcrypt
from flask_cors import CORS
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity
from datetime import datetime, timedelta
import os

app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_PATH'] = os.path.join(os.path.dirname(__file__), 'foodbridge.db')
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///' + app.config['SQLALCHEMY_DATABASE_PATH']
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['JWT_SECRET_KEY'] = 'super-secret-key-foodbridge' # In production, use an environment variable
app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(hours=24)

db = SQLAlchemy(app)
bcrypt = Bcrypt(app)
jwt = JWTManager(app)

import json
import flask_jwt_extended

@jwt.user_identity_loader
def user_identity_lookup(user_data):
    if isinstance(user_data, dict):
        return json.dumps(user_data)
    return str(user_data)

# Rebind get_jwt_identity locally to deserialize from JSON
_orig_get_jwt_identity = get_jwt_identity

def patched_get_jwt_identity():
    identity = _orig_get_jwt_identity()
    if isinstance(identity, str):
        try:
            return json.loads(identity)
        except Exception:
            pass
    return identity

get_jwt_identity = patched_get_jwt_identity

CORS(app)

# Models
class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password = db.Column(db.String(200), nullable=False)
    role = db.Column(db.String(20), nullable=False) # donor, ngo, volunteer

class Donation(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    donor_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    food_name = db.Column(db.String(100), nullable=False)
    quantity = db.Column(db.String(50), nullable=False)
    food_type = db.Column(db.String(50), nullable=False) # veg, non-veg, bakery, etc.
    expiry_time = db.Column(db.String(50), nullable=False)
    location_lat = db.Column(db.Float, nullable=False)
    location_lng = db.Column(db.Float, nullable=False)
    address = db.Column(db.String(255), nullable=False)
    image_url = db.Column(db.String(255), nullable=True)
    status = db.Column(db.String(20), default='pending') # pending, accepted, assigned, picked, delivered
    ngo_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=True)
    volunteer_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

# Auth Routes
@app.route('/api/auth/signup', methods=['POST'])
def signup():
    data = request.json
    if User.query.filter_by(email=data['email']).first():
        return jsonify({"message": "User already exists"}), 400
    
    hashed_pw = bcrypt.generate_password_hash(data['password']).decode('utf-8')
    new_user = User(
        username=data['username'],
        email=data['email'],
        password=hashed_pw,
        role=data['role']
    )
    db.session.add(new_user)
    db.session.commit()
    return jsonify({"message": "User created successfully"}), 201

@app.route('/api/auth/login', methods=['POST'])
def login():
    data = request.json
    user = User.query.filter_by(email=data['email']).first()
    if user and bcrypt.check_password_hash(user.password, data['password']):
        access_token = create_access_token(identity={'id': user.id, 'role': user.role, 'username': user.username})
        return jsonify(access_token=access_token, user={'id': user.id, 'username': user.username, 'role': user.role}), 200
    return jsonify({"message": "Invalid credentials"}), 401

@app.route('/api/auth/profile', methods=['GET'])
@jwt_required()
def profile():
    current_user = get_jwt_identity()
    user = User.query.get(current_user['id'])
    return jsonify(id=user.id, username=user.username, email=user.email, role=user.role)

# Donation Routes
@app.route('/api/donations', methods=['POST'])
@jwt_required()
def create_donation():
    current_user = get_jwt_identity()
    if current_user['role'] != 'donor':
        return jsonify({"message": "Unauthorized"}), 403
    
    data = request.json
    new_donation = Donation(
        donor_id=current_user['id'],
        food_name=data['food_name'],
        quantity=data['quantity'],
        food_type=data['food_type'],
        expiry_time=data['expiry_time'],
        location_lat=data['location_lat'],
        location_lng=data['location_lng'],
        address=data['address'],
        image_url=data.get('image_url')
    )
    db.session.add(new_donation)
    db.session.commit()
    return jsonify({"message": "Donation posted successfully"}), 201

@app.route('/api/donations', methods=['GET'])
@jwt_required()
def get_donations():
    current_user = get_jwt_identity()
    role = current_user['role']
    
    if role == 'donor':
        donations = Donation.query.filter_by(donor_id=current_user['id']).all()
    elif role == 'ngo':
        # NGOs see all pending donations + donations they accepted
        donations = Donation.query.filter((Donation.status == 'pending') | (Donation.ngo_id == current_user['id'])).all()
    elif role == 'volunteer':
        # Volunteers see donations that are accepted but not assigned, or assigned to them
        donations = Donation.query.filter((Donation.status == 'accepted') | (Donation.volunteer_id == current_user['id'])).all()
    else:
        donations = []

    return jsonify([{
        'id': d.id,
        'food_name': d.food_name,
        'quantity': d.quantity,
        'food_type': d.food_type,
        'expiry_time': d.expiry_time,
        'location_lat': d.location_lat,
        'location_lng': d.location_lng,
        'address': d.address,
        'status': d.status,
        'donor_id': d.donor_id,
        'ngo_id': d.ngo_id,
        'volunteer_id': d.volunteer_id,
        'created_at': d.created_at.isoformat()
    } for d in donations])

@app.route('/api/donations/<int:donation_id>/accept', methods=['POST'])
@jwt_required()
def accept_donation(donation_id):
    current_user = get_jwt_identity()
    if current_user['role'] != 'ngo':
        return jsonify({"message": "Unauthorized"}), 403
    
    donation = Donation.query.get(donation_id)
    if not donation or donation.status != 'pending':
        return jsonify({"message": "Donation not available"}), 400
    
    donation.status = 'accepted'
    donation.ngo_id = current_user['id']
    db.session.commit()
    return jsonify({"message": "Donation accepted"}), 200

@app.route('/api/donations/<int:donation_id>/assign', methods=['POST'])
@jwt_required()
def assign_volunteer(donation_id):
    current_user = get_jwt_identity()
    if current_user['role'] != 'volunteer':
        return jsonify({"message": "Unauthorized"}), 403
    
    donation = Donation.query.get(donation_id)
    if not donation or donation.status != 'accepted':
        return jsonify({"message": "Donation not available for assignment"}), 400
    
    donation.status = 'assigned'
    donation.volunteer_id = current_user['id']
    db.session.commit()
    return jsonify({"message": "Donation assigned to you"}), 200

@app.route('/api/donations/<int:donation_id>/status', methods=['POST'])
@jwt_required()
def update_status(donation_id):
    current_user = get_jwt_identity()
    if current_user['role'] != 'volunteer':
        return jsonify({"message": "Unauthorized"}), 403
    
    data = request.json
    new_status = data.get('status') # picked, delivered
    
    donation = Donation.query.get(donation_id)
    if not donation or donation.volunteer_id != current_user['id']:
        return jsonify({"message": "Unauthorized or donation not found"}), 403
    
    if new_status in ['picked', 'delivered']:
        donation.status = new_status
        db.session.commit()
        return jsonify({"message": f"Status updated to {new_status}"}), 200
    
    return jsonify({"message": "Invalid status"}), 400

# Test Automation Live Streaming Endpoints
import subprocess

@app.route('/api/tests/run/web', methods=['GET'])
def run_web_tests():
    def generate():
        cmd = ["node", os.path.normpath("c:/Users/ravee/Downloads/food_bridge2/selenium-tests/run-tests.js")]
        env = os.environ.copy()
        env["STREAM_JSON"] = "true"
        cwd = os.path.normpath("c:/Users/ravee/Downloads/food_bridge2/selenium-tests")
        
        proc = subprocess.Popen(cmd, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True, env=env, cwd=cwd)
        
        yield "data: " + json.dumps({"event": "start", "message": "Starting Selenium Web Tests..."}) + "\n\n"
        
        for line in proc.stdout:
            stripped = line.strip()
            if stripped.startswith("__TEST_RESULT__:"):
                json_str = stripped[len("__TEST_RESULT__:"):]
                yield f"data: {json_str}\n\n"
            else:
                yield "data: " + json.dumps({"event": "log", "message": line}) + "\n\n"
                
        proc.wait()
        yield "data: " + json.dumps({"event": "done", "code": proc.returncode}) + "\n\n"
        
    return Response(generate(), mimetype='text/event-stream')

@app.route('/api/tests/run/mobile', methods=['GET'])
def run_mobile_tests():
    def generate():
        import sys
        cmd = [sys.executable, os.path.normpath("c:/Users/ravee/Downloads/food_bridge2/appium-python-tests/run_tests.py")]
        cwd = os.path.normpath("c:/Users/ravee/Downloads/food_bridge2/appium-python-tests")
        
        proc = subprocess.Popen(cmd, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True, cwd=cwd)
        
        yield "data: " + json.dumps({"event": "start", "message": "Starting Appium Python Mobile Tests..."}) + "\n\n"
        
        for line in proc.stdout:
            stripped = line.strip()
            if stripped.startswith("__TEST_RESULT__:"):
                json_str = stripped[len("__TEST_RESULT__:"):]
                yield f"data: {json_str}\n\n"
            else:
                yield "data: " + json.dumps({"event": "log", "message": line}) + "\n\n"
                
        proc.wait()
        yield "data: " + json.dumps({"event": "done", "code": proc.returncode}) + "\n\n"
        
    return Response(generate(), mimetype='text/event-stream')

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
    app.run(debug=True, port=5000)
