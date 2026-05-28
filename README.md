<!DOCTYPE html>

<html class="dark" lang="en"><head>
<meta charset="utf-8"/>
<meta content="width=device-width, initial-scale=1.0" name="viewport"/>
<title>A.R.C.H.I.V.E.S. | JARVIS Core Interface</title>
<script src="https://cdn.tailwindcss.com?plugins=forms,container-queries"></script>
<link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;700&amp;family=Space+Grotesk:wght@300;400;600;700&amp;family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&amp;display=swap" rel="stylesheet"/>
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&amp;display=swap" rel="stylesheet"/>
<link href="https://fonts.googleapis.com/css2?family=Geist:wght@100..900&amp;family=JetBrains+Mono:wght@100..900&amp;family=Space+Grotesk:wght@100..900&amp;display=swap" rel="stylesheet"/>
<style>
        .material-symbols-outlined {
            font-variation-settings: 'FILL' 0, 'wght' 300, 'GRAD' 0, 'opsz' 24;
        }
        body {
            background-color: #10141a;
            color: #dfe2eb;
            overflow-x: hidden;
        }
        .glass-panel {
            backdrop-filter: blur(12px);
            background: rgba(16, 20, 26, 0.7);
            border: 1px solid rgba(0, 218, 243, 0.2);
        }
        .glow-cyan {
            box-shadow: 0 0 15px rgba(0, 218, 243, 0.2);
        }
        .orb-animation {
            animation: pulse 4s ease-in-out infinite;
        }
        @keyframes pulse {
            0%, 100% { transform: scale(1); filter: brightness(1); }
            50% { transform: scale(1.05); filter: brightness(1.3); }
        }
        .scan-line {
            width: 100%;
            height: 2px;
            background: linear-gradient(90deg, transparent, rgba(0, 229, 255, 0.5), transparent);
            position: absolute;
            top: -2px;
            animation: scan 8s linear infinite;
        }
        @keyframes scan {
            0% { top: 0%; }
            100% { top: 100%; }
        }
        .bracket-card::before {
            content: '';
            position: absolute;
            top: -1px; left: -1px; width: 10px; height: 10px;
            border-top: 2px solid #00daf3; border-left: 2px solid #00daf3;
        }
        .bracket-card::after {
            content: '';
            position: absolute;
            bottom: -1px; right: -1px; width: 10px; height: 10px;
            border-bottom: 2px solid #00daf3; border-right: 2px solid #00daf3;
        }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: #0a0e14; }
        ::-webkit-scrollbar-thumb { background: #00daf3; }
    </style>
<script id="tailwind-config">
        tailwind.config = {
            darkMode: "class",
            theme: {
                extend: {
                    "colors": {
                        "surface-container-lowest": "#0a0e14",
                        "secondary-fixed-dim": "#b0c6ff",
                        "surface-variant": "#31353c",
                        "inverse-on-surface": "#2d3137",
                        "on-background": "#dfe2eb",
                        "surface-dim": "#10141a",
                        "outline-variant": "#3b494c",
                        "tertiary": "#ffe9d9",
                        "error-container": "#93000a",
                        "on-tertiary-fixed-variant": "#6c3a00",
                        "on-secondary-container": "#f2f3ff",
                        "secondary": "#b0c6ff",
                        "tertiary-container": "#ffc594",
                        "primary-fixed-dim": "#00daf3",
                        "on-primary-fixed": "#001f24",
                        "surface-container-low": "#181c22",
                        "primary-fixed": "#9cf0ff",
                        "on-tertiary-fixed": "#2e1500",
                        "on-secondary-fixed": "#001945",
                        "outline": "#849396",
                        "on-primary-container": "#00626e",
                        "inverse-surface": "#dfe2eb",
                        "on-error": "#690005",
                        "on-secondary-fixed-variant": "#00429b",
                        "primary": "#c3f5ff",
                        "surface-bright": "#353940",
                        "secondary-fixed": "#d9e2ff",
                        "primary-container": "#00e5ff",
                        "on-primary-fixed-variant": "#004f58",
                        "surface-tint": "#00daf3",
                        "tertiary-fixed": "#ffdcc1",
                        "on-error-container": "#ffdad6",
                        "background": "#10141a",
                        "surface": "#10141a",
                        "secondary-container": "#0068ed",
                        "on-secondary": "#002d6e",
                        "on-surface-variant": "#bac9cc",
                        "on-tertiary": "#4c2700",
                        "surface-container-highest": "#31353c",
                        "on-tertiary-container": "#864a00",
                        "on-surface": "#dfe2eb",
                        "surface-container": "#1c2026",
                        "inverse-primary": "#006875",
                        "error": "#ffb4ab",
                        "on-primary": "#00363d",
                        "tertiary-fixed-dim": "#ffb778",
                        "surface-container-high": "#262a31"
                    },
                    "fontFamily": {
                        "label-caps": ["JetBrains Mono"],
                        "headline-xl": ["Space Grotesk"],
                        "body-md": ["Geist"],
                        "headline-lg": ["Space Grotesk"],
                        "body-sm": ["Geist"],
                        "data-mono": ["JetBrains Mono"],
                        "headline-lg-mobile": ["Space Grotesk"]
                    },
                    "fontSize": {
                        "label-caps": ["12px", {"lineHeight": "16px", "letterSpacing": "0.1em", "fontWeight": "500"}],
                        "headline-xl": ["48px", {"lineHeight": "56px", "letterSpacing": "-0.02em", "fontWeight": "700"}],
                        "body-md": ["16px", {"lineHeight": "24px", "fontWeight": "400"}],
                        "headline-lg": ["32px", {"lineHeight": "40px", "letterSpacing": "-0.01em", "fontWeight": "600"}],
                        "body-sm": ["14px", {"lineHeight": "20px", "fontWeight": "400"}],
                        "data-mono": ["14px", {"lineHeight": "18px", "fontWeight": "400"}],
                        "headline-lg-mobile": ["24px", {"lineHeight": "32px", "fontWeight": "600"}]
                    }
                }
            }
        }
    </script>
</head>
<body class="font-body-md text-on-background selection:bg-primary/30">
<!-- TOP APP BAR -->
<header class="fixed top-0 w-full z-50 flex justify-between items-center px-lg h-16 bg-surface/10 backdrop-blur-xl border-b border-primary/20 shadow-[0_0_15px_rgba(0,218,243,0.15)]">
<div class="flex items-center gap-sm">
<span class="font-headline-lg-mobile text-headline-lg-mobile tracking-tighter text-primary-fixed-dim">A.R.C.H.I.V.E.S.</span>
<div class="h-4 w-px bg-primary/20 mx-md"></div>
<span class="font-label-caps text-label-caps text-primary">STATUS: INTEGRATED</span>
</div>
<div class="flex items-center gap-lg">
<div class="relative hidden md:flex items-center">
<input class="bg-surface-container-low border border-primary/20 text-data-mono py-1 px-4 pr-10 focus:outline-none focus:border-primary transition-all w-64 rounded-sm" placeholder="QUERY CORE..." type="text"/>
<span class="material-symbols-outlined absolute right-3 text-primary-fixed-dim text-sm">search</span>
</div>
<div class="flex gap-md">
<span class="material-symbols-outlined text-primary cursor-pointer active:scale-95 hover:text-primary-container transition-colors">fingerprint</span>
<span class="material-symbols-outlined text-primary cursor-pointer active:scale-95 hover:text-primary-container transition-colors">sensors</span>
<span class="material-symbols-outlined text-primary cursor-pointer active:scale-95 hover:text-primary-container transition-colors">settings_input_component</span>
</div>
</div>
</header>
<!-- SIDE NAVIGATION -->
<nav class="fixed left-0 top-16 h-[calc(100vh-64px)] z-40 flex flex-col pt-md pb-lg bg-surface/5 backdrop-blur-md border-r border-primary/10 w-64 hidden md:flex">
<div class="px-lg py-md mb-lg border-b border-primary/5">
<h2 class="font-headline-lg text-headline-lg text-primary-fixed leading-none">J.A.R.V.I.S.</h2>
<p class="font-data-mono text-data-mono text-on-surface-variant/60 mt-1 uppercase tracking-widest">System Online</p>
</div>
<div class="flex-grow flex flex-col gap-xs">
<a class="flex items-center gap-md px-lg py-3 text-primary-container bg-primary/20 border-l-2 border-primary shadow-[0_0_10px_rgba(0,218,243,0.3)] transition-all duration-300" href="#">
<span class="material-symbols-outlined">hub</span>
<span class="font-data-mono text-data-mono">Core</span>
</a>
<a class="flex items-center gap-md px-lg py-3 text-on-surface-variant/60 hover:bg-primary/5 hover:text-primary-fixed-dim transition-all duration-300" href="#">
<span class="material-symbols-outlined">security</span>
<span class="font-data-mono text-data-mono">Tactical</span>
</a>
<a class="flex items-center gap-md px-lg py-3 text-on-surface-variant/60 hover:bg-primary/5 hover:text-primary-fixed-dim transition-all duration-300" href="#">
<span class="material-symbols-outlined">forum</span>
<span class="font-data-mono text-data-mono">Comms</span>
</a>
<a class="flex items-center gap-md px-lg py-3 text-on-surface-variant/60 hover:bg-primary/5 hover:text-primary-fixed-dim transition-all duration-300" href="#">
<span class="material-symbols-outlined">query_stats</span>
<span class="font-data-mono text-data-mono">Intel</span>
</a>
<a class="flex items-center gap-md px-lg py-3 text-on-surface-variant/60 hover:bg-primary/5 hover:text-primary-fixed-dim transition-all duration-300" href="#">
<span class="material-symbols-outlined">memory</span>
<span class="font-data-mono text-data-mono">Diagnostics</span>
</a>
</div>
<div class="mt-auto px-lg">
<button class="w-full py-2 border border-primary/30 bg-primary/5 hover:bg-primary/20 text-primary-fixed-dim font-label-caps text-label-caps transition-all uppercase tracking-widest mb-md">
                Execute Protocol
            </button>
<div class="flex items-center gap-md py-3 text-on-surface-variant/60 hover:text-error transition-colors cursor-pointer">
<span class="material-symbols-outlined">power_settings_new</span>
<span class="font-data-mono text-data-mono">Logout</span>
</div>
</div>
</nav>
<!-- MAIN CANVAS -->
<main class="md:ml-64 mt-16 p-lg min-h-screen flex flex-col lg:flex-row gap-lg">
<!-- LEFT/CENTER CONTENT (Documentation) -->
<div class="flex-grow space-y-lg">
<!-- HERO SECTION: THE CORE ORB -->
<section class="relative h-[400px] w-full glass-panel rounded-lg overflow-hidden flex flex-col items-center justify-center text-center p-xl">
<div class="scan-line"></div>
<div class="absolute inset-0 z-0 opacity-10 pointer-events-none" style="background-image: radial-gradient(#00daf3 1px, transparent 0); background-size: 24px 24px;"></div>
<!-- Central Orb -->
<div class="relative z-10 w-48 h-48 rounded-full bg-gradient-to-tr from-primary-container via-primary to-white orb-animation glow-cyan flex items-center justify-center">
<div class="absolute inset-0 rounded-full border-4 border-white/20 border-t-transparent animate-spin duration-1000"></div>
<div class="absolute -inset-4 rounded-full border border-primary/40 animate-pulse"></div>
<span class="material-symbols-outlined text-surface-container-lowest text-6xl" style="font-variation-settings: 'FILL' 1;">deployed_code</span>
</div>
<div class="mt-lg z-10">
<h1 class="font-headline-xl text-headline-xl text-primary-fixed-dim mb-sm">ANICADE J.A.R.V.I.S.</h1>
<p class="font-data-mono text-on-surface-variant max-w-lg mx-auto uppercase tracking-widest">Advanced Neural Integrated Cybernetic Automated Defense &amp; Extraction System</p>
</div>
<!-- Corner HUD Data -->
<div class="absolute top-4 left-4 text-left font-data-mono text-[10px] text-primary/40">
<div>LAT: 37.7749° N</div>
<div>LON: 122.4194° W</div>
<div>ALT: 12.4 KM</div>
</div>
<div class="absolute bottom-4 right-4 text-right font-data-mono text-[10px] text-primary/40">
<div>CPU: 0.04%</div>
<div>MEM: 12.8PB</div>
<div>NET: 100Tbps</div>
</div>
</section>
<!-- BENTO GRID CONTENT -->
<div class="grid grid-cols-1 md:grid-cols-2 gap-lg">
<!-- QUICK START -->
<div class="bracket-card glass-panel p-lg relative min-h-[280px]">
<div class="flex items-center gap-sm mb-md text-primary">
<span class="material-symbols-outlined">bolt</span>
<h3 class="font-label-caps text-label-caps uppercase">01. Quick Start Protocol</h3>
</div>
<div class="space-y-md">
<p class="text-on-surface-variant font-body-sm leading-relaxed">
                            Initialize the core matrix by deploying the tactical deployment package. J.A.R.V.I.S. requires a minimum of 4 neural nodes to begin sentient environmental awareness.
                        </p>
<div class="bg-surface-container-lowest border border-primary/10 p-md rounded-sm font-data-mono text-sm overflow-x-auto">
<code class="text-primary-container">$ npm install @anicade/jarvis-core</code><br/>
<code class="text-primary-container">$ jarvis --init --profile tactical</code>
</div>
</div>
</div>
<!-- INTELLIGENCE MATRIX -->
<div class="bracket-card glass-panel p-lg relative min-h-[280px]">
<div class="flex items-center gap-sm mb-md text-primary">
<span class="material-symbols-outlined">psychology</span>
<h3 class="font-label-caps text-label-caps uppercase">02. Intelligence Matrix</h3>
</div>
<ul class="space-y-sm">
<li class="flex items-start gap-sm">
<span class="text-primary text-xs mt-1">●</span>
<span class="text-on-surface-variant font-body-sm"><strong class="text-primary-fixed">Cognitive Vision:</strong> Real-time heuristic scanning of visual input streams.</span>
</li>
<li class="flex items-start gap-sm">
<span class="text-primary text-xs mt-1">●</span>
<span class="text-on-surface-variant font-body-sm"><strong class="text-primary-fixed">Semantic Mesh:</strong> Multi-layered natural language processing via localized LLM.</span>
</li>
<li class="flex items-start gap-sm">
<span class="text-primary text-xs mt-1">●</span>
<span class="text-on-surface-variant font-body-sm"><strong class="text-primary-fixed">Threat Vector:</strong> Predictive analysis of incoming cryptographic attacks.</span>
</li>
</ul>
</div>
<!-- SYSTEM COMMANDS TABLE -->
<div class="md:col-span-2 bracket-card glass-panel p-lg relative overflow-hidden">
<div class="flex items-center justify-between mb-lg">
<div class="flex items-center gap-sm text-primary">
<span class="material-symbols-outlined">terminal</span>
<h3 class="font-label-caps text-label-caps uppercase">Operational Commands</h3>
</div>
<div class="bg-primary/10 px-md py-1 border border-primary/20 rounded-full flex items-center gap-sm">
<span class="w-2 h-2 rounded-full bg-primary-container animate-pulse"></span>
<span class="font-data-mono text-[10px] text-primary">REAL-TIME OVERRIDE ENABLED</span>
</div>
</div>
<table class="w-full border-collapse">
<thead>
<tr class="text-left font-label-caps text-[10px] text-primary/60 border-b border-primary/20">
<th class="pb-md uppercase">Command</th>
<th class="pb-md uppercase">Function</th>
<th class="pb-md uppercase">Security Clearance</th>
<th class="pb-md uppercase">Latency</th>
</tr>
</thead>
<tbody class="font-data-mono text-sm divide-y divide-primary/5">
<tr class="hover:bg-primary/5 transition-colors">
<td class="py-md text-primary-fixed">/scan --all</td>
<td class="py-md text-on-surface-variant">Deep infrastructure diagnostics</td>
<td class="py-md"><span class="bg-primary/10 text-primary-fixed px-2 py-0.5 rounded text-[10px]">L3_ELITE</span></td>
<td class="py-md text-primary/40">12ms</td>
</tr>
<tr class="hover:bg-primary/5 transition-colors">
<td class="py-md text-primary-fixed">/deploy --hot</td>
<td class="py-md text-on-surface-variant">Instant cluster replication</td>
<td class="py-md"><span class="bg-error-container/20 text-error px-2 py-0.5 rounded text-[10px]">ROOT</span></td>
<td class="py-md text-primary/40">45ms</td>
</tr>
<tr class="hover:bg-primary/5 transition-colors">
<td class="py-md text-primary-fixed">/comms --secure</td>
<td class="py-md text-on-surface-variant">Activate quantum-encrypted mesh</td>
<td class="py-md"><span class="bg-primary/10 text-primary-fixed px-2 py-0.5 rounded text-[10px]">L2_OPERATOR</span></td>
<td class="py-md text-primary/40">8ms</td>
</tr>
<tr class="hover:bg-primary/5 transition-colors">
<td class="py-md text-primary-fixed">/purge --cache</td>
<td class="py-md text-on-surface-variant">Clear cognitive temporary buffers</td>
<td class="py-md"><span class="bg-primary/10 text-primary-fixed px-2 py-0.5 rounded text-[10px]">L1_BASIC</span></td>
<td class="py-md text-primary/40">2ms</td>
</tr>
</tbody>
</table>
</div>
<!-- ARCHITECTURE SECTION -->
<div class="md:col-span-2 glass-panel p-lg relative flex flex-col md:flex-row gap-lg items-center">
<div class="md:w-1/3">
<div class="aspect-square glass-panel rounded-full p-md border-primary/40 flex items-center justify-center relative">
<div class="absolute inset-0 border-2 border-dashed border-primary/20 rounded-full animate-[spin_20s_linear_infinite]"></div>
<img class="w-full h-full rounded-full object-cover mix-blend-screen opacity-70" data-alt="A sophisticated close-up of a futuristic circuit board with glowing neon cyan micro-processors and fiber-optic pathways. The lighting is low-key, focusing on the intricate glowing connections and metallic surfaces. The overall aesthetic is high-tech, cinematic, and obsidian-themed, perfectly matching a technical JARVIS environment with sharp focus and professional photography style." src="https://lh3.googleusercontent.com/aida-public/AB6AXuBwyH-WQtJeTtJ2yjldPcvROoWYx_GsKEY1kwZ_6xvja8NJN8ihl0K7KIXD5ZLtLenqxI5P1U8njp3DeoPncclqBIdKEVxLNKAhtHxsyQ4-KCUFlxZEHuyZTdDXbc74oesltCtLlfFesB8Q7hdp7XLOtizNmtmhu0X4vm8n4x549tkjoE4pctBZufyUHhvS5eEeNlY0LUiDorf7V7zSrlh8TsQvrjeHWy6GI-w41ojtZj9q3cTyVtz6hzo5htcWh6XOkFYya6DkDZT9"/>
</div>
</div>
<div class="md:w-2/3">
<div class="flex items-center gap-sm mb-md text-primary">
<span class="material-symbols-outlined">architecture</span>
<h3 class="font-label-caps text-label-caps uppercase">Architecture Design</h3>
</div>
<p class="text-on-surface-variant font-body-sm mb-md leading-relaxed">
                            The A.R.C.H.I.V.E.S. framework is built on a distributed micro-kernel architecture. Unlike monolithic AI systems, JARVIS delegates processing across decentralized "Synapse Nodes," ensuring 99.999% uptime even during total localized catastrophic failure.
                        </p>
<div class="grid grid-cols-3 gap-md">
<div class="text-center p-md bg-surface-container-low border border-primary/10">
<div class="text-primary-fixed font-headline-lg mb-0 leading-none">0.02</div>
<div class="font-label-caps text-[8px] text-on-surface-variant/60 uppercase">Jitter (ms)</div>
</div>
<div class="text-center p-md bg-surface-container-low border border-primary/10">
<div class="text-primary-fixed font-headline-lg mb-0 leading-none">4.2M</div>
<div class="font-label-caps text-[8px] text-on-surface-variant/60 uppercase">TPS Peak</div>
</div>
<div class="text-center p-md bg-surface-container-low border border-primary/10">
<div class="text-primary-fixed font-headline-lg mb-0 leading-none">128B</div>
<div class="font-label-caps text-[8px] text-on-surface-variant/60 uppercase">Params</div>
</div>
</div>
</div>
</div>
</div>
</div>
<!-- RIGHT SIDEBAR (Live Feed) -->
<aside class="w-full lg:w-80 shrink-0 space-y-lg">
<!-- System Feed Terminal -->
<div class="glass-panel h-[500px] flex flex-col border-primary/40 relative">
<div class="p-md border-b border-primary/20 flex items-center justify-between bg-primary/5">
<span class="font-label-caps text-[10px] text-primary">LIVE SYSTEM FEED</span>
<span class="material-symbols-outlined text-xs text-primary animate-pulse" style="font-variation-settings: 'FILL' 1;">circle</span>
</div>
<div class="flex-grow p-md font-data-mono text-[11px] overflow-hidden text-primary/80 leading-relaxed" id="terminal-feed">
<!-- Lines added via JS -->
<div class="text-primary/40">[ 08:42:01 ] ATTACHING CORE KERNEL...</div>
<div class="text-primary/40">[ 08:42:02 ] SYNAPSE_MESH_A READY.</div>
<div class="text-primary/40">[ 08:42:02 ] SYNAPSE_MESH_B READY.</div>
<div class="text-primary/40">[ 08:42:03 ] ALLOCATING 2.4TB VRAM...</div>
<div class="text-secondary">[ 08:42:05 ] INFRASTRUCTURE VERIFIED.</div>
<div class="text-primary-container">[ 08:42:06 ] JARVIS_UI v4.0.2 MOUNTED.</div>
</div>
<div class="p-md border-t border-primary/20 bg-surface-container-lowest flex items-center gap-sm">
<span class="text-primary text-[10px]">&gt;</span>
<input class="bg-transparent border-none p-0 text-[11px] font-data-mono text-primary-fixed-dim focus:ring-0 w-full" placeholder="COMMAND_INPUT..." type="text"/>
</div>
</div>
<!-- Real-time Status Indicators -->
<div class="glass-panel p-lg space-y-lg">
<h4 class="font-label-caps text-label-caps text-primary uppercase border-b border-primary/10 pb-md">Sub-system Status</h4>
<div class="space-y-md">
<div>
<div class="flex justify-between font-data-mono text-[10px] mb-1">
<span class="text-on-surface-variant">NEURAL LOAD</span>
<span class="text-primary">42%</span>
</div>
<div class="w-full h-1 bg-surface-container-highest rounded-full overflow-hidden">
<div class="bg-primary h-full w-[42%]"></div>
</div>
</div>
<div>
<div class="flex justify-between font-data-mono text-[10px] mb-1">
<span class="text-on-surface-variant">CORE TEMP</span>
<span class="text-primary">34°C</span>
</div>
<div class="w-full h-1 bg-surface-container-highest rounded-full overflow-hidden">
<div class="bg-primary-container h-full w-[34%]"></div>
</div>
</div>
<div>
<div class="flex justify-between font-data-mono text-[10px] mb-1">
<span class="text-on-surface-variant">SHIELD DEPLETION</span>
<span class="text-error">0.00%</span>
</div>
<div class="w-full h-1 bg-surface-container-highest rounded-full overflow-hidden">
<div class="bg-error h-full w-[0%]"></div>
</div>
</div>
</div>
<div class="grid grid-cols-2 gap-sm pt-md">
<div class="bg-primary/10 border border-primary/20 p-md flex flex-col items-center">
<span class="material-symbols-outlined text-primary mb-1">satellite_alt</span>
<span class="font-label-caps text-[8px] text-on-surface-variant uppercase">Uplink</span>
<span class="font-data-mono text-[10px] text-primary-fixed">ACTIVE</span>
</div>
<div class="bg-primary/10 border border-primary/20 p-md flex flex-col items-center">
<span class="material-symbols-outlined text-primary mb-1">security</span>
<span class="font-label-caps text-[8px] text-on-surface-variant uppercase">Firewall</span>
<span class="font-data-mono text-[10px] text-primary-fixed">STEALTH</span>
</div>
</div>
</div>
</aside>
</main>
<!-- FAB (Only on specific trigger but kept for system utility) -->
<div class="fixed bottom-lg right-lg z-50">
<button class="w-14 h-14 rounded-full bg-primary-container text-on-primary-container shadow-[0_0_20px_rgba(0,229,255,0.6)] flex items-center justify-center hover:scale-110 active:scale-95 transition-all">
<span class="material-symbols-outlined text-2xl" style="font-variation-settings: 'FILL' 1;">add_moderator</span>
</button>
</div>
<!-- TERMINAL FEED SCRIPT -->
<script>
        const feed = document.getElementById('terminal-feed');
        const logs = [
            "SCANNING PERIMETER NODES...",
            "ENCRYPTED PACKET RECEIVED FROM SECTOR 7G",
            "UPDATING NEURAL WEIGHTS: EPOCH 45,921",
            "THREAT_VECTOR_DETECTED: NULL",
            "COOLING SYSTEM OPTIMIZED",
            "BACKUP SEQUENCE INITIATED IN DATACENTER_B",
            "RECOGNIZING USER BIOMETRIC PROFILE...",
            "AUTHORIZED ACCESS GRANTED: L3_ELITE",
            "HEURISTIC ANALYSIS COMPLETE: SYSTEM NOMINAL",
            "QUANTUM ENTANGLEMENT ESTABLISHED",
            "SYNCHRONIZING WITH GALAXY_HUB_ONE"
        ];

        function addLog() {
            const time = new Date().toLocaleTimeString('en-GB', { hour12: false });
            const logEntry = document.createElement('div');
            logEntry.className = 'text-primary/60 opacity-0 transition-opacity duration-500';
            logEntry.innerHTML = `<span class="text-primary/30">[ ${time} ]</span> ${logs[Math.floor(Math.random() * logs.length)]}`;
            
            feed.appendChild(logEntry);
            
            // Trigger animation
            setTimeout(() => logEntry.classList.remove('opacity-0'), 10);

            // Maintain scroll bottom
            if (feed.children.length > 18) {
                feed.removeChild(feed.children[0]);
            }
        }

        setInterval(addLog, 2500);
    </script>
</body></html>
