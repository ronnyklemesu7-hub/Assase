import logging
import os
from logging.handlers import RotatingFileHandler

def setup_logger(name, log_file, level=logging.INFO):
    """Function to setup as many loggers as you want"""
    
    # Ensure logs directory exists
    log_dir = os.path.dirname(log_file)
    if log_dir and not os.path.exists(log_dir):
        os.makedirs(log_dir)

    formatter = logging.Formatter('%(asctime)s %(levelname)s [%(name)s] %(message)s')

    # Rotating File Handler (10MB max per file, keep 5 backups)
    handler = RotatingFileHandler(log_file, maxBytes=10*1024*1024, backupCount=5)
    handler.setFormatter(formatter)

    # Console Handler
    console_handler = logging.StreamHandler()
    console_handler.setFormatter(formatter)

    logger = logging.getLogger(name)
    logger.setLevel(level)
    
    # Avoid duplicate handlers if setup is called multiple times
    if not logger.handlers:
        logger.addHandler(handler)
        logger.addHandler(console_handler)

    return logger

# Default app logger
app_logger = setup_logger('ASAASE_BASE', os.path.join("runs", "logs", "asaase.log"))
radio_logger = setup_logger('ASAASE_RADIO', os.path.join("runs", "logs", "radio.log"))
api_logger = setup_logger('ASAASE_API', os.path.join("runs", "logs", "api.log"))
