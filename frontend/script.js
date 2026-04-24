const state = {
    loadedPackets: [],
    filteredPackets: [],
    displayedPackets: [],
    isRunning: false,
    currentIndex: 0,
    playbackTimer: null,
    fetchController: null,
    runId: 0,
    filters: {
        protocol: "all",
        source: "",
        destination: ""
    }
};

const trafficTableBody = document.getElementById("trafficTableBody");
const logsContainer = document.getElementById("logsContainer");

const totalPackets = document.getElementById("totalPackets");
const tcpPackets = document.getElementById("tcpPackets");
const udpPackets = document.getElementById("udpPackets");
const avgPacketSize = document.getElementById("avgPacketSize");

const startButton = document.getElementById("startButton");
const stopButton = document.getElementById("stopButton");
const resetButton = document.getElementById("resetButton");
const filterButton = document.getElementById("filterButton");

const filterProtocol = document.getElementById("filterProtocol");
const sourceIp = document.getElementById("sourceIp");
const destinationIp = document.getElementById("destinationIp");

const monitorStatus = document.getElementById("monitorStatus");
const statusDot = document.getElementById("statusDot");

function normalizePacket(packet) {
    return {
        time: packet.Time ?? packet.time ?? "--",
        srcIp: packet.Source ?? packet.source ?? "",
        dstIp: packet.Destination ?? packet.destination ?? "",
        protocol: String(packet.Protocol ?? packet.protocol ?? "").toUpperCase(),
        length: Number(packet.Length ?? packet.length ?? 0),
        srcPort: packet.Src_Port ?? packet.src_port ?? packet.srcPort ?? "-",
        dstPort: packet.Dst_Port ?? packet.dst_port ?? packet.dstPort ?? "-",
        size: Number(packet.Size ?? packet.size ?? packet.Length ?? packet.length ?? 0)
    };
}

function setRunningUI(running) {
    if (running) {
        monitorStatus.textContent = "Monitoring started";
        statusDot.style.background = "#4ade80";
        statusDot.style.boxShadow = "0 0 0 4px rgba(74, 222, 128, 0.15)";
    } else {
        monitorStatus.textContent = "Monitoring stopped";
        statusDot.style.background = "#f87171";
        statusDot.style.boxShadow = "0 0 0 4px rgba(248, 113, 113, 0.15)";
    }
}

function addLog(message, type = "normal") {
    const log = document.createElement("div");
    log.className = "log__item";

    const now = new Date();
    const timeString = now.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit"
    });

    log.innerHTML = `
        <span class="log__time">${timeString}</span>
        <p class="log__message log__message--${type}">${message}</p>
    `;

    logsContainer.prepend(log);
}

function renderTable(rows) {
    trafficTableBody.innerHTML = "";

    if (!rows.length) {
        trafficTableBody.innerHTML = `
            <tr>
                <td colspan="8" class="empty__state">No packets to display.</td>
            </tr>
        `;
        return;
    }

    rows.forEach((row) => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td>${row.time}</td>
            <td>${row.srcIp}</td>
            <td>${row.dstIp}</td>
            <td>${row.protocol}</td>
            <td>${row.srcPort}</td>
            <td>${row.dstPort}</td>
            <td>${row.length}</td>
            <td>${row.size} B</td>
        `;
        trafficTableBody.appendChild(tr);
    });
}

function appendRow(row) {
    const emptyState = trafficTableBody.querySelector(".empty__state");
    if (emptyState) trafficTableBody.innerHTML = "";

    const tr = document.createElement("tr");
    tr.innerHTML = `
        <td>${row.time}</td>
        <td>${row.srcIp}</td>
        <td>${row.dstIp}</td>
        <td>${row.protocol}</td>
        <td>${row.srcPort}</td>
        <td>${row.dstPort}</td>
        <td>${row.length}</td>
        <td>${row.size} B</td>
    `;
    trafficTableBody.appendChild(tr);
}

function renderStats(rows) {
    const total = rows.length;
    const tcp = rows.filter((item) => item.protocol === "TCP").length;
    const udp = rows.filter((item) => item.protocol === "UDP").length;
    const avg = total
        ? Math.round(rows.reduce((sum, item) => sum + item.size, 0) / total)
        : 0;

    totalPackets.textContent = total;
    tcpPackets.textContent = tcp;
    udpPackets.textContent = udp;
    avgPacketSize.textContent = `${avg} B`;
}

function readFilters() {
    return {
        protocol: filterProtocol.value,
        source: sourceIp.value.trim().toLowerCase(),
        destination: destinationIp.value.trim().toLowerCase()
    };
}

function applyFilterToPackets(packets) {
    const filters = state.filters;

    return packets.filter((packet) => {
        const protocolMatch =
            filters.protocol === "all" || packet.protocol === filters.protocol;

        const sourceMatch =
            filters.source === "" ||
            String(packet.srcIp).toLowerCase().includes(filters.source);

        const destinationMatch =
            filters.destination === "" ||
            String(packet.dstIp).toLowerCase().includes(filters.destination);

        return protocolMatch && sourceMatch && destinationMatch;
    });
}

function stopPlayback({ quiet = false } = {}) {
    state.runId += 1;
    state.isRunning = false;

    if (state.playbackTimer) {
        clearInterval(state.playbackTimer);
        state.playbackTimer = null;
    }

    if (state.fetchController) {
        state.fetchController.abort();
        state.fetchController = null;
    }

    setRunningUI(false);

    if (!quiet) {
        addLog("Monitoring stopped.", "error");
    }
}

function startPlaybackLoop(runId) {
    state.currentIndex = 0;
    state.displayedPackets = [];
    renderTable([]);
    renderStats([]);

    state.playbackTimer = setInterval(() => {
        if (!state.isRunning || runId !== state.runId) {
            clearInterval(state.playbackTimer);
            state.playbackTimer = null;
            return;
        }

        if (state.currentIndex >= state.filteredPackets.length) {
            clearInterval(state.playbackTimer);
            state.playbackTimer = null;
            state.isRunning = false;
            setRunningUI(false);

            addLog(
                `Packet playback finished. ${state.filteredPackets.length} packet(s) displayed.`,
                "success"
            );
            return;
        }

        const packet = state.filteredPackets[state.currentIndex++];
        state.displayedPackets.push(packet);
        appendRow(packet);
        renderStats(state.displayedPackets);
    }, 500);
}

async function startMonitoring() {
    if (state.isRunning) {
        addLog("Monitoring is already running.", "warning");
        return;
    }

    stopPlayback({ quiet: true });

    state.isRunning = true;
    state.runId += 1;
    const runId = state.runId;

    setRunningUI(true);
    addLog("Fetching packets from /static ...", "success");

    state.fetchController = new AbortController();

    const staticUrl = "http://localhost:8000/static";

    try {
        const response = await fetch(staticUrl, {
            method: "GET",
            headers: {
                "Accept": "application/json"
            },
            signal: state.fetchController.signal
        });

        if (!response.ok) {
            throw new Error(`Server returned ${response.status}`);
        }

        const data = await response.json();

        if (runId !== state.runId || !state.isRunning) {
            return;
        }

        state.loadedPackets = Array.isArray(data) ? data.map(normalizePacket) : [];
        state.filteredPackets = applyFilterToPackets(state.loadedPackets);

        addLog(`Fetched ${state.loadedPackets.length} packet(s) from backend.`, "success");

        if (!state.filteredPackets.length) {
            state.isRunning = false;
            setRunningUI(false);
            renderTable([]);
            renderStats([]);
            addLog("No packets matched the current filters.", "warning");
            return;
        }

        startPlaybackLoop(runId);
    } catch (error) {
        if (error.name === "AbortError") return;

        state.isRunning = false;
        setRunningUI(false);
        renderTable([]);
        renderStats([]);
        addLog(`Failed to fetch packets: ${error.message}`, "error");
    } finally {
        state.fetchController = null;
    }
}

function applyFilters() {
    state.filters = readFilters();

    if (state.loadedPackets.length === 0) {
        addLog("Filters saved. They will apply after Start.", "warning");
        return;
    }

    const wasRunning = state.isRunning;

    if (wasRunning) {
        stopPlayback({ quiet: true });
    }

    state.filteredPackets = applyFilterToPackets(state.loadedPackets);
    state.displayedPackets = [];

    if (!state.filteredPackets.length) {
        renderTable([]);
        renderStats([]);
        addLog("No packets matched the selected filters.", "warning");
        return;
    }

    if (wasRunning) {
        state.isRunning = true;
        state.runId += 1;
        const runId = state.runId;
        setRunningUI(true);
        addLog(`Filter applied. Replaying ${state.filteredPackets.length} packet(s).`, "success");
        startPlaybackLoop(runId);
    } else {
        renderTable(state.filteredPackets);
        renderStats(state.filteredPackets);
        addLog(
            `Filter applied. ${state.filteredPackets.length} packet(s) matched.`,
            "success"
        );
    }
}

function resetFilters() {
    filterProtocol.value = "all";
    sourceIp.value = "";
    destinationIp.value = "";

    state.filters = readFilters();

    if (state.loadedPackets.length > 0) {
        state.filteredPackets = applyFilterToPackets(state.loadedPackets);

        if (state.isRunning) {
            stopPlayback({ quiet: true });
            state.isRunning = true;
            state.runId += 1;
            const runId = state.runId;
            setRunningUI(true);
            addLog("Filters reset. Replaying full packet list.", "warning");
            startPlaybackLoop(runId);
            return;
        }

        renderTable(state.filteredPackets);
        renderStats(state.filteredPackets);
    } else {
        renderTable([]);
        renderStats([]);
    }

    addLog("Filters cleared.", "warning");
}

startButton.addEventListener("click", startMonitoring);
stopButton.addEventListener("click", () => stopPlayback());
filterButton.addEventListener("click", applyFilters);
resetButton.addEventListener("click", resetFilters);

document.addEventListener("DOMContentLoaded", () => {
    setRunningUI(false);
    renderTable([]);
    renderStats([]);
    addLog("Ready. Press Start to load packets from /static.", "success");
});