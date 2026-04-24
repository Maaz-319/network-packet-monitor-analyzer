from scapy.all import sniff, IP, TCP, UDP
import time

captured_data = []
capturing = False

def process_packet(packet):
    global captured_data

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

    data = {
        "Time": round(time.time(), 2),
        "Source": packet[IP].src,
        "Destination": packet[IP].dst,
        "Protocol": proto,
        "Length": len(packet),
        "Src_Port": src_port,
        "Dst_Port": dst_port,
        "Size": len(packet)
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
    global capturing
    captured_data.clear()
    capturing = False