// 1. Data & State Setup
const colorNames = [
    "slate",
    "gray",
    "zinc",
    "neutral",
    "stone",
    "red",
    "orange",
    "amber",
    "yellow",
    "lime",
    "green",
    "emerald",
    "teal",
    "cyan",
    "sky",
    "blue",
    "indigo",
    "violet",
    "purple",
    "fuchsia",
    "pink",
    "rose",
];
const shades = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950];
const warmColors = [
    "red",
    "orange",
    "amber",
    "yellow",
    "rose",
    "pink",
    "fuchsia",
];
const coldColors = [
    "lime",
    "green",
    "emerald",
    "teal",
    "cyan",
    "sky",
    "blue",
    "indigo",
    "violet",
    "purple",
];

let allColors = [];
colorNames.forEach((name) => {
    shades.forEach((shade) => {
        allColors.push({
            name: name,
            shade: shade,
            isLight: shade <= 400,
            isDark: shade >= 500,
            isWarm: warmColors.includes(name),
            isCold: coldColors.includes(name),
        });
    });
});

let filteredColors = [...allColors];
let activeFilters = { light: false, dark: false, cold: false, warm: false };
let currentMode = "solid";
let currentClassStr = "";

// DOM Elements
const container = document.getElementById("swipeContainer");
const classDisplay = document.getElementById("classDisplay");
const countDisplay = document.getElementById("colorCount");
const toast = document.getElementById("toast");
const filterBtns = document.querySelectorAll(".filter-btn");
const modeBtns = document.querySelectorAll(".mode-btn");
const gradDir = document.getElementById("gradDir");

// 2. Core Logic
function getSolidClass(colorObj) {
    return `bg-${colorObj.name}-${colorObj.shade}`;
}

function getGradientClass(colorObj) {
    const dir = gradDir.value;
    const fromClass = `from-${colorObj.name}-${colorObj.shade}`;
    let toShade = colorObj.shade < 500 ? colorObj.shade + 400 : 950;
    if (colorObj.shade >= 800) toShade = colorObj.shade - 500;
    const toClass = `to-${colorObj.name}-${toShade}`;
    return `bg-linear-${dir} ${fromClass} ${toClass}`;
}

function getMixGradientClass(colorObj) {
    const dir = gradDir.value;
    const fromClass = `from-${colorObj.name}-${colorObj.shade}`;
    const randomIndex2 = Math.floor(Math.random() * filteredColors.length);
    const colorObj2 = filteredColors[randomIndex2];
    const toClass = `to-${colorObj2.name}-${colorObj2.shade}`;
    return `bg-linear-${dir} ${fromClass} ${toClass}`;
}

function setRandomColor() {
    if (filteredColors.length === 0) {
        container.className = `swipe-area flex-1 relative w-full flex flex-col items-center justify-center p-6 color-transition bg-black`;
        classDisplay.textContent = "No Colors Match";
        return;
    }

    const randomIndex = Math.floor(Math.random() * filteredColors.length);
    const colorObj = filteredColors[randomIndex];

    container.className = `swipe-area flex-1 relative w-full flex flex-col items-center justify-center p-6 color-transition cursor-crosshair`;

    if (currentMode === "solid") {
        currentClassStr = getSolidClass(colorObj);
    } else if (currentMode === "gradient") {
        currentClassStr = getGradientClass(colorObj);
    } else if (currentMode === "mix") {
        currentClassStr = getMixGradientClass(colorObj);
    }

    const classesToAdd = currentClassStr.split(" ");
    container.classList.add(...classesToAdd);
    classDisplay.textContent = currentClassStr;
}

function updatePoolCount() {
    countDisplay.innerHTML = `<i class="fa-solid fa-droplet text-xs mr-1"></i>${filteredColors.length}`;
}

// 3. UI Interactions (Filters & Modes)
filterBtns.forEach((btn) => {
    btn.addEventListener("click", (e) => {
        const targetBtn = e.target.closest("button");
        const filter = targetBtn.dataset.filter;
        activeFilters[filter] = !activeFilters[filter];

        if (activeFilters[filter]) {
            targetBtn.classList.replace("opacity-60", "opacity-100");
            targetBtn.classList.replace(
                "border-white/30",
                "border-emerald-500",
            );
            targetBtn.classList.add("bg-emerald-500/20", "text-emerald-300");
        } else {
            targetBtn.classList.replace("opacity-100", "opacity-60");
            targetBtn.classList.replace(
                "border-emerald-500",
                "border-white/30",
            );
            targetBtn.classList.remove("bg-emerald-500/20", "text-emerald-300");
        }

        filteredColors = allColors.filter((c) => {
            let match = true;
            const hasShadeFilter = activeFilters.light || activeFilters.dark;
            if (hasShadeFilter) {
                if (
                    !(
                        (activeFilters.light && c.isLight) ||
                        (activeFilters.dark && c.isDark)
                    )
                )
                    match = false;
            }
            const hasTempFilter = activeFilters.cold || activeFilters.warm;
            if (hasTempFilter) {
                if (
                    !(
                        (activeFilters.cold && c.isCold) ||
                        (activeFilters.warm && c.isWarm)
                    )
                )
                    match = false;
            }
            return match;
        });

        updatePoolCount();
        setRandomColor();
    });
});

// Mode Toggles
modeBtns.forEach((btn) => {
    btn.addEventListener("click", (e) => {
        const targetBtn = e.target.closest("button");
        currentMode = targetBtn.dataset.mode;

        modeBtns.forEach((b) => {
            b.className =
                "mode-btn px-3 py-1.5 rounded-md text-xs font-semibold text-white/60 hover:text-white transition-all";
        });

        if (currentMode === "solid") {
            targetBtn.className =
                "mode-btn px-3 py-1.5 rounded-md text-xs font-semibold bg-white text-black shadow-sm transition-all";
            gradDir.classList.add("hidden"); // ซ่อน Select
        } else {
            targetBtn.className =
                "mode-btn px-3 py-1.5 rounded-md text-xs font-semibold bg-emerald-500 text-white shadow-[0_0_10px_rgba(16,185,129,0.4)] transition-all";
            gradDir.classList.remove("hidden"); // แสดง Select
        }

        setRandomColor();
    });
});

gradDir.addEventListener("change", setRandomColor);

// 4. Swipe & Scroll Events
let startX = 0;
let startY = 0;
let isDragging = false;
let scrollTimeout = null;

// ฟังก์ชันแยกสำหรับแสดง Toast ให้เรียกใช้ง่ายๆ
function showToast() {
    toast.classList.remove("opacity-0", "translate-y-4");
    toast.classList.add("opacity-100", "translate-y-0");
    setTimeout(() => {
        toast.classList.remove("opacity-100", "translate-y-0");
        toast.classList.add("opacity-0", "translate-y-4");
    }, 1500);
}

// แผนสำรองสำหรับการ Copy (ช่วยแก้ปัญหาตอนเทสต์ผ่าน HTTP หรือมือถือบล็อก)
function fallbackCopyTextToClipboard(text) {
    const textArea = document.createElement("textarea");
    textArea.value = text;
    textArea.style.position = "fixed"; // ซ่อนไว้ไม่ให้หน้าจอกระตุก
    textArea.style.top = "-9999px";
    textArea.style.left = "-9999px";
    document.body.appendChild(textArea);

    textArea.focus();
    textArea.select();

    try {
        const successful = document.execCommand("copy");
        if (successful) showToast();
    } catch (err) {
        console.error("Fallback copy failed", err);
    }

    document.body.removeChild(textArea);
}

async function copyToClipboard() {
    if (!currentClassStr) return;

    try {
        // ลองใช้วิธีสมัยใหม่ก่อน (ต้องการ HTTPS หรือ Localhost)
        if (navigator.clipboard && window.isSecureContext) {
            await navigator.clipboard.writeText(currentClassStr);
            showToast();
        } else {
            // ถ้าไม่ใช่ HTTPS ให้ใช้แผนสำรอง
            fallbackCopyTextToClipboard(currentClassStr);
        }
    } catch (err) {
        // ถ้าวิธีใหม่พัง (เช่น บราวเซอร์มองว่าไม่ได้เกิดจากการคลิก) ให้สลับไปแผนสำรอง
        console.warn("Clipboard API failed, using fallback...", err);
        fallbackCopyTextToClipboard(currentClassStr);
    }
}

container.addEventListener(
    "wheel",
    (e) => {
        if (scrollTimeout) return;
        scrollTimeout = setTimeout(() => {
            scrollTimeout = null;
        }, 150);
        setRandomColor();
    },
    { passive: true },
);

container.addEventListener("pointerdown", (e) => {
    if (e.target.closest("header")) return;
    isDragging = true;
    startX = e.clientX;
    startY = e.clientY;
    container.setPointerCapture(e.pointerId);
});

container.addEventListener("pointerup", (e) => {
    if (!isDragging) return;
    isDragging = false;

    const diffX = e.clientX - startX;
    const diffY = e.clientY - startY;

    if (Math.abs(diffX) > Math.abs(diffY)) {
        if (Math.abs(diffX) > 40) setRandomColor();
    } else {
        if (diffY < -40) copyToClipboard();
    }
});

container.addEventListener("pointercancel", () => (isDragging = false));

// เพิ่มฟีเจอร์: แตะที่กรอบคลาสเพื่อ Copy ได้โดยตรง (แก้บั๊กคนปัดไม่ถนัด)
classDisplay.parentElement.classList.remove("pointer-events-none"); // ปลดล็อกให้กดกรอบข้อความได้
classDisplay.parentElement.addEventListener("pointerdown", (e) => {
    e.stopPropagation(); // ไม่ให้ไปทริกเกอร์การปัดสีพื้นหลัง
    copyToClipboard();
});

// Init App
updatePoolCount();
setRandomColor();
