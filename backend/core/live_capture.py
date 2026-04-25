from scapy.all import sniff, IP, TCP, UDP, ICMP
import datetime

captured_data = []
capturing = False
start_time = None

def process_packet(packet):
    global captured_data, start_time

    if not packet.haslayer(IP):
        return

    proto = "OTHER"
    src_port = None
    dst_port = None

    if packet.haslayer(TCP):
        proto = "TCP"
        src_port = packet[TCP].sport
        dst_port = packet[TCP].dport
    elif packet.haslayer(UDP):
        proto = "UDP"
        src_port = packet[UDP].sport
        dst_port = packet[UDP].dport
    elif packet.haslayer(ICMP):
        proto = "ICMP"
        src_port = None
        dst_port = None

    if start_time is None:
        start_time = packet.time

    data = {
        "ID": packet[IP].id,
        "IP_Version": packet[IP].version,
        "Time": round(packet.time - start_time, 2) if start_time else 0,
        "Source": packet[IP].src,
        "Destination": packet[IP].dst,
        "Protocol": proto,
        "Length": len(packet),
        "Src_Port": src_port,
        "Dst_Port": dst_port,
        "Size": len(packet),
        "TTL": packet[IP].ttl,
        "Checksum": packet[IP].chksum
    }

    captured_data.append(data)
    print(data)


def stop_filter(packet):
    return not capturing


def start_sniffing():
    global capturing
    capturing = True
    sniff(filter="ip", prn=process_packet, stop_filter=stop_filter)


def stop_sniffing():
    global capturing, start_time
    captured_data.clear()
    start_time = None
    capturing = False