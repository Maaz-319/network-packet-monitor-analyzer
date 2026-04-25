import json
import os

from model.packet_parse import packet_parse

DB_FILE = "db.json"

def seed_database():
    sample_data = [
    {"ID": 1001, "IPV": 4, "Time": 1.01, "Source": "192.168.1.10", "Destination": "93.184.216.34", "Protocol": "TCP", "Length": 150, "Src_Port": 52344, "Dst_Port": 80, "Size": 150, "TTL": 64, "Checksum": 34521},
    {"ID": 1002, "IPV": 4, "Time": 1.02, "Source": "93.184.216.34", "Destination": "192.168.1.10", "Protocol": "TCP", "Length": 512, "Src_Port": 80, "Dst_Port": 52344, "Size": 512, "TTL": 52, "Checksum": 45678},

    {"ID": 1003, "IPV": 4, "Time": 1.05, "Source": "192.168.1.11", "Destination": "172.217.3.110", "Protocol": "TCP", "Length": 200, "Src_Port": 52345, "Dst_Port": 443, "Size": 200, "TTL": 64, "Checksum": 22334},
    {"ID": 1004, "IPV": 4, "Time": 1.06, "Source": "172.217.3.110", "Destination": "192.168.1.11", "Protocol": "TCP", "Length": 1200, "Src_Port": 443, "Dst_Port": 52345, "Size": 1200, "TTL": 50, "Checksum": 33445},

    {"ID": 1005, "IPV": 4, "Time": 1.10, "Source": "192.168.1.12", "Destination": "8.8.8.8", "Protocol": "UDP", "Length": 70, "Src_Port": 53000, "Dst_Port": 53, "Size": 70, "TTL": 64, "Checksum": 11223},
    {"ID": 1006, "IPV": 4, "Time": 1.11, "Source": "8.8.8.8", "Destination": "192.168.1.12", "Protocol": "UDP", "Length": 120, "Src_Port": 53, "Dst_Port": 53000, "Size": 120, "TTL": 117, "Checksum": 22113},

    {"ID": 1007, "IPV": 4, "Time": 1.20, "Source": "192.168.1.13", "Destination": "192.168.1.1", "Protocol": "TCP", "Length": 90, "Src_Port": 52346, "Dst_Port": 22, "Size": 90, "TTL": 64, "Checksum": 55667},
    {"ID": 1008, "IPV": 4, "Time": 1.21, "Source": "192.168.1.1", "Destination": "192.168.1.13", "Protocol": "TCP", "Length": 110, "Src_Port": 22, "Dst_Port": 52346, "Size": 110, "TTL": 64, "Checksum": 66778},

    {"ID": 1009, "IPV": 4, "Time": 1.30, "Source": "192.168.1.14", "Destination": "192.168.1.2", "Protocol": "TCP", "Length": 180, "Src_Port": 52347, "Dst_Port": 25, "Size": 180, "TTL": 64, "Checksum": 77889},

    {"ID": 1010, "IPV": 4, "Time": 1.40, "Source": "0.0.0.0", "Destination": "255.255.255.255", "Protocol": "UDP", "Length": 300, "Src_Port": 68, "Dst_Port": 67, "Size": 300, "TTL": 128, "Checksum": 88990},

    {"ID": 1011, "IPV": 4, "Time": 1.50, "Source": "192.168.1.15", "Destination": "192.168.1.3", "Protocol": "TCP", "Length": 220, "Src_Port": 52348, "Dst_Port": 143, "Size": 220, "TTL": 64, "Checksum": 99001},
    ]
    with open(os.path.join(os.path.dirname(__file__), "../data", DB_FILE), "w") as f:
        json.dump(sample_data, f)