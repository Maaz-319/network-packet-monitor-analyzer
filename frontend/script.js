const state = {
  mode: "static",
  running: false,
  packets: [],
  filteredPackets: [],
  selectedPacket: null,
  liveOffset: 0,
  pollTimer: null,
  loadingLive: false,
  filters: {
    protocol: "",
    source: "",
    destination: "",
  },
};

const PortMapping = {
  "80": "HTTP",
  "443": "HTTPS",
  "53": "DNS",
  "22": "SSH",
  "25": "SMTP",
  "110": "POP3",
  "143": "IMAP",
};

const elements = {
  startBtn: document.getElementById("startBtn"),
  stopBtn: document.getElementById("stopBtn"),
  modeButton: document.getElementById("modeButton"),
  protocolFilter: document.getElementById("protocolFilter"),
  sourceIpFilter: document.getElementById("sourceIpFilter"),
  destinationIpFilter: document.getElementById("destinationIpFilter"),
  applyFilterBtn: document.getElementById("applyFilterBtn"),
  resetFilterBtn: document.getElementById("resetFilterBtn"),
  packetTableBody: document.getElementById("packetTableBody"),
  packetDetail: document.getElementById("packetDetail"),
  totalPackets: document.getElementById("totalPackets"),
  averagePacketSize: document.getElementById("averagePacketSize"),
  protocolStats: document.getElementById("protocolStats"),
  saveFileBtn: document.getElementById("saveFileBtn"),
  loadFileBtn: document.getElementById("loadFileBtn"),
};

function normalizePacket(packet) {
  return {
    ID: packet.ID ?? packet.id ?? null,
    IPV: packet.IPV ?? packet.ipv ?? null,
    Time: packet.Time ?? packet.time ?? "-",
    TTL: packet.TTL ?? packet.ttl ?? null,
    Checksum: packet.Checksum ?? packet.checksum ?? null,
    Source: packet.Source ?? packet.source ?? "-",
    Destination: packet.Destination ?? packet.destination ?? "-",
    Protocol: String(packet.Protocol ?? packet.protocol ?? "").toUpperCase() || "UNKNOWN",
    Length: Number(packet.Length ?? packet.length ?? 0),
    Src_Port: packet.Src_Port ?? packet.src_port ?? packet.srcPort ?? null,
    Dst_Port: packet.Dst_Port ?? packet.dst_port ?? packet.dstPort ?? null,
    Size: Number(packet.Size ?? packet.size ?? packet.Length ?? packet.length ?? 0),
  };
}

function setButtonState() {
  elements.startBtn.disabled = state.running;
  elements.stopBtn.disabled = !state.running;
}

async function checkApiHealth() {
  try {
    const response = await fetch("http://localhost:8000/");
    const label = document.getElementById("apiHealthLabel");
    if (response.ok) {
      label.textContent = "Online";
      label.className = "api-health-online";
    } else {
      label.textContent = "Offline";
      label.className = "api-health-offline";
    }
  } catch (error) {
    const label = document.getElementById("apiHealthLabel");
    label.textContent = "Offline";
    label.className = "api-health-offline";
  }
}

function setDetail(packet) {
  if (!packet) {
    elements.packetDetail.value = "Select a packet row to view full details.";
    return;
  }

  elements.packetDetail.value = "";
  elements.packetDetail.value += `Packet ID: ${packet.ID ?? "N/A"}\n`;
  elements.packetDetail.value += `-----------------------------------------------------\n`;
  elements.packetDetail.value += `Internet Protocol Version: ${packet.IPV ?? "N/A"}\n`;
  elements.packetDetail.value += `Service: ${PortMapping[packet.Src_Port] || PortMapping[packet.Dst_Port] || "Unknown"}\n`;
  elements.packetDetail.value += `TTL: ${packet.TTL ?? "N/A"}\n`;
  elements.packetDetail.value += `[ Checksum Value: ${packet.Checksum ?? "N/A"} ]\n`;
  elements.packetDetail.value += `Time: ${packet.Time}\n`;
  elements.packetDetail.value += `Source: ${packet.Source}\n`;
  elements.packetDetail.value += `Destination: ${packet.Destination}\n`;
  elements.packetDetail.value += `Protocol: ${packet.Protocol}\n`;
  elements.packetDetail.value += `Length: ${packet.Length}\n`;
  elements.packetDetail.value += `Size: ${packet.Size} bytes\n`;
  elements.packetDetail.value += `Source Port: ${packet.Src_Port ?? "N/A"}\n`;
  elements.packetDetail.value += `Destination Port: ${packet.Dst_Port ?? "N/A"}\n`;
}

function renderTable() {
  const rows = state.filteredPackets;
  elements.packetTableBody.innerHTML = "";

  if (!rows.length) {
    const row = document.createElement("tr");
    row.innerHTML = '<td colspan="4">No packets available.</td>';
    elements.packetTableBody.appendChild(row);
    setDetail(null);
    return;
  }

  rows.forEach((packet) => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${packet.Time}</td>
      <td>${packet.Source}</td>
      <td>${packet.Destination}</td>
      <td>${packet.Protocol}</td>
    `;
    row.addEventListener("click", () => {
      state.selectedPacket = packet;
      setDetail(packet);
    });
    elements.packetTableBody.appendChild(row);
  });
}

function renderStats() {
  const packets = state.filteredPackets;
  const protocolCounts = {};
  let sizeTotal = 0;

  packets.forEach((packet) => {
    const protocol = packet.Protocol || "UNKNOWN";
    protocolCounts[protocol] = (protocolCounts[protocol] || 0) + 1;
    sizeTotal += Number(packet.Size) || 0;
  });

  elements.totalPackets.textContent = String(packets.length);
  elements.averagePacketSize.textContent = packets.length ? (sizeTotal / packets.length).toFixed(2) : "0.00";

  elements.protocolStats.innerHTML = "";
  const protocols = Object.keys(protocolCounts);

  if (!protocols.length) {
    elements.protocolStats.textContent = "No protocol data.";
    return;
  }

  protocols.forEach((protocol) => {
    const entry = document.createElement("div");
    entry.className = "protocol-row";
    entry.innerHTML = `<span>${protocol}</span><span>${protocolCounts[protocol]}</span>`;
    elements.protocolStats.appendChild(entry);
  });
}

function isIPv4(value) {
  const parts = value.split(".");
  if (parts.length !== 4) return false;

  for (let part of parts) {
    if (part === "" || isNaN(part)) return false;

    const num = Number(part);
    if (num < 0 || num > 255) return false;

    if (part !== num.toString()) return false;
  }

  return true;
}

function getFilteredPackets() {
  const protocol = state.filters.protocol.trim().toLowerCase();
  const source = state.filters.source.trim().toLowerCase();
  const destination = state.filters.destination.trim().toLowerCase();

  if (source && !isIPv4(source)) {
    alert("Invalid source IP address format. Please enter a valid IPv4 address.");
    return state.filteredPackets;
  }

  if (destination && !isIPv4(destination)) {
    alert("Invalid destination IP address format. Please enter a valid IPv4 address.");
    return state.filteredPackets;
  }

  return state.packets.filter((packet) => {
    const protocolMatch = !protocol || String(packet.Protocol || "").toLowerCase() === protocol;
    const sourceMatch = !source || String(packet.Source || "").toLowerCase().includes(source);
    const destinationMatch = !destination || String(packet.Destination || "").toLowerCase().includes(destination);
    return protocolMatch && sourceMatch && destinationMatch;
  });
}

function applyCurrentFilters() {
  state.filteredPackets = getFilteredPackets();
  renderTable();
  renderStats();
}

function updateProtocolOptions() {
  const current = elements.protocolFilter.value;
  const protocols = new Set(state.packets.map((packet) => packet.Protocol).filter(Boolean));

  elements.protocolFilter.innerHTML = '<option value="">All Protocols</option>';
  protocols.forEach((protocol) => {
    const option = document.createElement("option");
    option.value = protocol;
    option.textContent = protocol;
    elements.protocolFilter.appendChild(option);
  });

  if ([...protocols].includes(current)) {
    elements.protocolFilter.value = current;
  }
}

function readFilters() {
  state.filters = {
    protocol: elements.protocolFilter.value,
    source: elements.sourceIpFilter.value,
    destination: elements.destinationIpFilter.value,
  };
}

async function fetchStaticPackets() {
  const response = await fetch("http://localhost:8000/static");
  if (!response.ok) {
    throw new Error(`Static fetch failed with ${response.status}`);
  }
  return response.json();
}

async function startStaticCapture() {
  state.running = true;
  setButtonState();

  try {
    const data = await fetchStaticPackets();
    state.packets = Array.isArray(data) ? data.map(normalizePacket) : [];
    state.selectedPacket = null;
    updateProtocolOptions();
    readFilters();
    applyCurrentFilters();
    setDetail(null);
  } catch (error) {
    console.error("Failed to fetch static packets:", error);
    state.packets = [];
    state.filteredPackets = [];
    state.selectedPacket = null;
    renderTable();
    renderStats();
    setDetail(null);
  }

  state.running = false;
  setButtonState();
}

async function startLiveBackend() {
  const response = await fetch("http://localhost:8000/start");
  if (!response.ok) {
    throw new Error(`Live start failed with ${response.status}`);
  }
}

async function stopLiveBackend() {
  await fetch("http://localhost:8000/stop");
}

function stopLivePolling() {
  if (state.pollTimer) {
    clearInterval(state.pollTimer);
    state.pollTimer = null;
  }
  state.loadingLive = false;
}

async function pollLivePackets() {
  if (state.loadingLive) {
    return;
  }

  state.loadingLive = true;

  try {
    const response = await fetch(`http://localhost:8000/live?offset=${state.liveOffset}`);
    if (!response.ok) {
      throw new Error(`Live fetch failed with ${response.status}`);
    }

    const payload = await response.json();
    const newPackets = Array.isArray(payload.data) ? payload.data.map(normalizePacket) : [];

    if (newPackets.length) {
      state.packets.push(...newPackets);
      state.liveOffset = typeof payload.next_offset === "number" ? payload.next_offset : state.packets.length;
      updateProtocolOptions();
      applyCurrentFilters();
    }
  } catch (error) {
    console.error("Failed to load live packets:", error);
    stopCapture(true);
  } finally {
    state.loadingLive = false;
  }
}

async function startLiveCapture() {
  state.running = true;
  setButtonState();

  try {
    await startLiveBackend();
    state.packets = [];
    state.filteredPackets = [];
    state.selectedPacket = null;
    state.liveOffset = 0;
    updateProtocolOptions();
    renderTable();
    renderStats();
    setDetail(null);

    await pollLivePackets();
    stopLivePolling();
    state.pollTimer = setInterval(pollLivePackets, 1000);
  } catch (error) {
    console.error("Failed to start live capture:", error);
    stopCapture(true);
  }
}

async function stopCapture(silent = false) {
  state.running = false;
  setButtonState();

  if (state.mode === "live") {
    stopLivePolling();
    try {
      await stopLiveBackend();
    } catch (error) {
      console.error("Failed to stop live capture:", error);
    }
  }

  if (!silent) {
    state.selectedPacket = null;
  }
}

function handleStart() {
  if (state.running) {
    return;
  }

  if (state.mode === "live") {
    startLiveCapture();
    return;
  }

  startStaticCapture();
}

function handleStop() {
  stopCapture();
}

function handleApplyFilter() {
  readFilters();
  applyCurrentFilters();
  setDetail(state.selectedPacket);
}

function handleResetFilter() {
  elements.protocolFilter.value = "";
  elements.sourceIpFilter.value = "";
  elements.destinationIpFilter.value = "";
  readFilters();
  applyCurrentFilters();
  state.selectedPacket = null;
  setDetail(null);
}

function toggleMode() {
  if (state.running) {
    stopCapture(true);
  }

  state.mode = state.mode === "static" ? "live" : "static";
  elements.modeButton.textContent = state.mode === "static" ? "Switch to Live Capture" : "Switch to Static Capture";
  elements.modeButton.className = state.mode === "static" ? "mode-static" : "mode-live";
}

function saveFile() {
  if (!state.packets.length) {
    alert("No packets to save.");
    return;
  }
    const blob = new Blob(
        [JSON.stringify(state.packets, null, 2)],
        { type: "application/json" }
    );

    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "bcsf24m007_NTMA.json";
    a.click();

    URL.revokeObjectURL(url);
}

function loadFile() {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";

    input.addEventListener("change", (event) => {
        const file = event.target.files[0];
        if (!file) {
            return;
        }

        if (file.type !== "application/json") {
            alert("Only Json files are allowed");
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = JSON.parse(e.target.result);
                if (Array.isArray(data)) {
                    state.packets = data.map(normalizePacket);
                    state.selectedPacket = null;
                    updateProtocolOptions();
                    readFilters();
                    applyCurrentFilters();
                    setDetail(null);
                } else {
                    alert("Invalid file format: Expected an array of packets");
                }
            } catch (error) {
                alert("Selected File has been corrupted");
            }
        };

        reader.readAsText(file);
    });

    input.click();
}

elements.startBtn.addEventListener("click", handleStart);
elements.stopBtn.addEventListener("click", handleStop);
elements.applyFilterBtn.addEventListener("click", handleApplyFilter);
elements.resetFilterBtn.addEventListener("click", handleResetFilter);
elements.modeButton.addEventListener("click", toggleMode);
elements.saveFileBtn.addEventListener("click", saveFile);
elements.loadFileBtn.addEventListener("click", loadFile);

setButtonState();
renderTable();
renderStats();
setDetail(null);
checkApiHealth();