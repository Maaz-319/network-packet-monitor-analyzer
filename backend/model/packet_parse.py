def packet_parse(packet):
    return {
        "Time": packet.time,
        "Source": packet.src,
        "Destination": packet.dst,
        "Protocol": packet.proto,
        "Length": packet.length,
        "Src Port": packet.sport if hasattr(packet, 'sport') else None,
        "Dst Port": packet.dport if hasattr(packet, 'dport') else None,
        "Size": len(packet)
    }