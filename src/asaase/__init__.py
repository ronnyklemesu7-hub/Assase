from flask import Flask

def init_asaase(app: Flask):
    from src.asaase.db import init_asaase_db
    from src.asaase.radio_listener import start_radio_listener
    from src.asaase.health_monitor import start_health_monitor
    from src.asaase.api import asaase_bp
    
    # 1. Initialize DB tables
    init_asaase_db()
    
    # 2. Register Blueprint
    app.register_blueprint(asaase_bp, url_prefix='/api/asaase')
    
    # 3. Start Background Threads
    start_radio_listener()
    start_health_monitor()
    # start_mission_engine() # Disable Demo/Simulation Logic

    
    print("ASAASE Robot Control System Initialized Successfully.")
