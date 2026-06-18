import React, { useEffect, useRef } from "react";
import { Animated } from "react-native";
import Svg, { Path, Circle, G } from "react-native-svg";

interface Props {
    level: number;        // 1-5+
    health: number;       // 0-100
    rescueMode: boolean;  // true => dry state
    flowerCount?: number; // numar flori curent, fara limita maxima, doar relevant la level >= 5
    size?: number;
}

const LEAF_BASE = "#7DC86E";
const LEAF_LIGHT = "#9BF57D";
const LEAF_DARK = "#8CE16E";

const DRY_TRUNK_MAIN = "#5C4033";
const DRY_TRUNK_SHADOW = "#3E2A1E";
const DRY_BRANCH = "#A07239";

const FLOWER_COLORS = [ 
    { petal: "#FF65A3", center: "#FFD166" },
    { petal: "#B36BE0", center: "#FFD166" },
    { petal: "#FFC640", center: "#A8530A" },
];

function seededRandom(seed: number) {
    let s = seed % 2147483647;
    if (s <= 0) s += 2147483646;
    return () => {
        s = (s * 16807) % 2147483647;
        return (s - 1) / 2147483646;
    };
}

const CROWN_CENTER = { x: 250, y: 155 };
const CROWN_RADIUS = 115;

function randomCrownPosition(rng: () => number) {
    const angle = rng() * 2 * Math.PI;
    const radius = Math.sqrt(rng()) * CROWN_RADIUS * 0.92;
    return {
        x: CROWN_CENTER.x + Math.cos(angle) * radius,
        y: CROWN_CENTER.y + Math.sin(angle) * radius * 0.85,
    };
}

function Ground() {
    return (
        <G>
            <Path fill="#9A7863" d="M443.376,503.172C407.851,461.181,337.291,432.552,256,432.552s-151.85,28.629-187.377,70.621" />
            <Path fill="#8C695C" d="M307.967,436.648c-16.64-2.626-34.018-4.096-51.967-4.096c-81.29,0-151.85,28.629-187.377,70.621h103.934C200.24,470.452,249.24,445.919,307.967,436.648z" />
            <Path fill="#785353" d="M476.69,512H35.31c-4.879,0-8.828-3.953-8.828-8.828s3.948-8.828,8.828-8.828H476.69c4.879,0,8.828,3.953,8.828,8.828S481.569,512,476.69,512z" />
        </G>
    );
}

function Flower({ x, y, colorIndex }: { x: number; y: number; colorIndex: number }) {
    const c = FLOWER_COLORS[colorIndex % FLOWER_COLORS.length];
    return (
        <G transform={`translate(${x}, ${y}) scale(0.75)`}>
            <Circle cx="0" cy="-10" r="8" fill={c.petal} />
            <Circle cx="9.5" cy="-3.1" r="8" fill={c.petal} />
            <Circle cx="5.9" cy="8.1" r="8" fill={c.petal} />
            <Circle cx="-5.9" cy="8.1" r="8" fill={c.petal} />
            <Circle cx="-9.5" cy="-3.1" r="8" fill={c.petal} />
            <Circle cx="0" cy="0" r="6" fill={c.center} />
        </G>
    );
}

function Stage1({ dry }: { dry: boolean }) {
    const stroke = dry ? DRY_TRUNK_MAIN : LEAF_BASE;
    const leafA = dry ? "#C49A5C" : LEAF_LIGHT;
    const leafB = dry ? DRY_BRANCH : LEAF_DARK;
    return (
        <G>
            <Path d="M 256 460 L 256 320" stroke={stroke} strokeWidth={16} strokeLinecap="round" />
            <Path d="M 256 360 Q 230 350 200 340" stroke={stroke} strokeWidth={16} strokeLinecap="round" fill="none" />
            <Path d="M 256 340 Q 280 330 310 320" stroke={stroke} strokeWidth={16} strokeLinecap="round" fill="none" />
            <Ground />
            <G transform="translate(210, 345) rotate(-60) scale(1.2)">
                <Path d="M 0,0 C -50,-40 -50,-100 0,-130 L 0,0 Z" fill={leafA} />
                <Path d="M 0,0 C 50,-40 50,-100 0,-130 L 0,0 Z" fill={leafB} />
            </G>
            <G transform="translate(300, 325) rotate(60) scale(1.2)">
                <Path d="M 0,0 C -50,-40 -50,-100 0,-130 L 0,0 Z" fill={leafA} />
                <Path d="M 0,0 C 50,-40 50,-100 0,-130 L 0,0 Z" fill={leafB} />
            </G>
        </G>
    );
}

function Stage2({ dry }: { dry: boolean }) {
    const stroke = dry ? DRY_TRUNK_MAIN : "#68B954";
    const leafA = dry ? "#D9B380" : "#A8FA88";
    const leafB = dry ? "#B0823C" : "#78D659";
    const branches = [
        { t: "translate(180, 330) rotate(-75) scale(1.4)" },
        { t: "translate(320, 300) rotate(75) scale(1.5)" },
        { t: "translate(180, 195) rotate(-60) scale(1.25)" },
        { t: "translate(330, 185) rotate(65) scale(1.3)" },
        { t: "translate(255, 190) rotate(15) scale(1.3)" },
    ];
    return (
        <G>
            <Path d="M 256 480 L 256 380" stroke={stroke} strokeWidth={16} strokeLinecap="round" fill="none" />
            <Ground />
            <Path
                d="M 256 380 L 256 180 M 256 360 Q 220 330 150 330 M 256 320 Q 310 290 370 300 M 256 260 Q 230 230 170 190 M 256 220 Q 300 190 350 180"
                stroke={stroke}
                strokeWidth={16}
                strokeLinecap="round"
                fill="none"
            />
            {branches.map((b, i) => (
                <G key={i} transform={b.t}>
                    <Path d="M 0,0 C -50,-40 -50,-100 0,-130 L 0,0 Z" fill={leafA} />
                    <Path d="M 0,0 C 50,-40 50,-100 0,-130 L 0,0 Z" fill={leafB} />
                </G>
            ))}
        </G>
    );
}

function Stage3({ dry }: { dry: boolean }) {
    const trunkA = dry ? DRY_TRUNK_MAIN : "#795548";
    const trunkB = dry ? DRY_TRUNK_SHADOW : "#5D4037";
    const blobA = dry ? "#6B4423" : "#4A8B3A";
    const blobB = dry ? DRY_BRANCH : "#68B954";
    const blobC = dry ? "#C49A5C" : "#8CE16E";
    return (
        <G>
            <G>
                <Path fill={trunkA} d="M248.985,512.001c-11.814,0-21.392-9.578-21.392-21.392V224.011c0-11.814,9.578-21.392,21.392-21.392 c11.814,0,21.392,9.578,21.392,21.392v266.598C270.377,502.424,260.799,512.001,248.985,512.001z" />
                <Path fill={trunkB} d="M248.985,490.609V224.011c0-7.913,4.308-14.806,10.696-18.507c-3.149-1.825-6.795-2.885-10.696-2.885 c-11.814,0-21.392,9.578-21.392,21.392v266.598c0,11.814,9.578,21.392,21.392,21.392c3.901,0,7.547-1.061,10.696-2.885 C253.293,505.415,248.985,498.523,248.985,490.609z" />
                <Path d="M 249 350 Q 180 320 150 250" stroke={trunkA} strokeWidth={16} strokeLinecap="round" fill="none" />
                <Path d="M 249 350 Q 180 320 150 250" stroke={trunkB} strokeWidth={6} strokeLinecap="round" fill="none" transform="translate(3, 2)" />
                <Path d="M 249 320 Q 320 290 350 220" stroke={trunkA} strokeWidth={14} strokeLinecap="round" fill="none" />
                <Path d="M 249 320 Q 320 290 350 220" stroke={trunkB} strokeWidth={5} strokeLinecap="round" fill="none" transform="translate(3, 2)" />
            </G>
            <Ground />
            <G transform="translate(120, 5) scale(0.62)">
                <G transform="translate(0, 41) rotate(300, 280, 20)">
                    <Path fill={blobA} d="M204.238,280.912c-10.934-14.73-28.457-24.278-48.211-24.278c-33.142,0-60.01,26.867-60.01,60.01 s26.867,60.01,60.01,60.01c6.732,0,13.197-1.125,19.239-3.17c7.221,4.1,15.562,6.453,24.458,6.453 c27.404,0,49.618-22.215,49.618-49.618C249.342,304.436,229.524,283.193,204.238,280.912z" />
                </G>
                <G transform="translate(30, 150) rotate(23, 230, 230)">
                    <Path fill={blobA} d="M399.965,158.283c0-27.919-9.67-54.277-26.63-75.144c-2.728-0.316-5.5-0.496-8.313-0.496 c-39.561,0-71.631,32.07-71.631,71.631c0,4.549,0.443,8.991,1.253,13.304c-40.745,7.042-71.746,42.535-71.746,85.291 c0,36.69,22.832,68.027,55.053,80.637c14.276-15.826,23.793-36.026,26.224-58.332C358.732,264.263,399.965,216,399.965,158.283z" />
                </G>
                <G transform="translate(10, 90) rotate(25, 29, 230)">
                    <Path fill={blobB} d="M119.301,272.699c-14.349-7.492-24.15-22.502-24.15-39.811c0-23.215,17.623-42.313,40.221-44.651 c-2.244-0.241-4.519-0.377-6.828-0.377c-0.536,0-1.064,0.027-1.596,0.041c-7.085-15.474-22.695-26.23-40.827-26.23 c-24.794,0-44.893,20.099-44.893,44.893c0,17.308,9.8,32.318,24.151,39.811c-0.122,1.605-0.204,3.221-0.204,4.857 c0,34.999,28.372,63.371,63.371,63.371c0.834,0,1.663-0.018,2.49-0.05c-7.502-10.412-11.936-23.183-11.936-36.996 C119.097,275.92,119.18,274.304,119.301,272.699z" />
                </G>
                <G transform="translate(-50, 150)">
                    <Path fill={blobC} d="M200.627,191.729c-12.403,0-24.074,3.135-34.266,8.653c-10.556-7.863-23.642-12.519-37.818-12.519 c-0.536,0-1.064,0.027-1.596,0.041c-7.086-15.474-22.695-26.23-40.827-26.23c-24.794,0-44.893,20.099-44.893,44.893 c0,17.308,9.8,32.318,24.15,39.811c-0.121,1.605-0.204,3.221-0.204,4.857c0,34.999,28.372,63.371,63.371,63.371 c6.395,0,12.564-0.956,18.384-2.718c13.198,14.733,32.363,24.011,53.699,24.011c39.811,0,72.084-32.273,72.084-72.084 S240.438,191.729,200.627,191.729z" />
                </G>
            </G>
        </G>
    );
}

function Stage4({ dry }: { dry: boolean }) {
    const trunkA = dry ? DRY_TRUNK_MAIN : "#795548";
    const trunkB = dry ? DRY_TRUNK_SHADOW : "#5D4037";
    const blobMain = dry ? "#6B4423" : "#4A8B3A";
    const blobSec = dry ? DRY_BRANCH : "#68B954";
    const blobTer = dry ? "#C49A5C" : "#8CE16E";
    return (
        <G>
            <Path fill={trunkA} d="M248.985,512.001c-11.814,0-21.392-9.578-21.392-21.392V224.011c0-11.814,9.578-21.392,21.392-21.392 c11.814,0,21.392,9.578,21.392,21.392v266.598C270.377,502.424,260.799,512.001,248.985,512.001z" />
            <Path fill={trunkB} d="M248.985,490.609V224.011c0-7.913,4.308-14.806,10.696-18.507c-3.149-1.825-6.795-2.885-10.696-2.885 c-11.814,0-21.392,9.578-21.392,21.392v266.598c0,11.814,9.578,21.392,21.392,21.392c3.901,0,7.547-1.061,10.696-2.885 C253.293,505.415,248.985,498.523,248.985,490.609z" />
            <Path d="M 249 305 Q 295 285 308 255" stroke={trunkA} strokeWidth={13} strokeLinecap="round" fill="none" />
            <Path d="M 249 305 Q 295 285 308 255" stroke={trunkB} strokeWidth={5} strokeLinecap="round" fill="none" transform="translate(3, 2)" />
            <Ground />
            <G fill={blobMain}>
                <Circle cx="249" cy="175" r="92" />
                <Circle cx="180" cy="200" r="60" />
                <Circle cx="318" cy="200" r="60" />
                <Circle cx="205" cy="135" r="58" />
                <Circle cx="295" cy="135" r="58" />
                <Circle cx="249" cy="115" r="55" />
                <Circle cx="160" cy="165" r="42" />
                <Circle cx="338" cy="165" r="42" />
            </G>
            <G transform="translate(70, 95) scale(0.86)">
                <Path transform="translate(150,-165) rotate(36)" fill={blobSec} d="M399.965,158.283c0-27.919-9.67-54.277-26.63-75.144c-2.728-0.316-5.5-0.496-8.313-0.496 c-39.561,0-71.631,32.07-71.631,71.631c0,4.549,0.443,8.991,1.253,13.304c-40.745,7.042-71.746,42.535-71.746,85.291 c0,36.69,22.832,68.027,55.053,80.637c14.276-15.826,23.793-36.026,26.224-58.332C358.732,264.263,399.965,216,399.965,158.283z" />
                <Path transform="translate(-25,-80) rotate(5)" fill={blobTer} d="M200.627,191.729c-12.403,0-24.074,3.135-34.266,8.653c-10.556-7.863-23.642-12.519-37.818-12.519 c-0.536,0-1.064,0.027-1.596,0.041c-7.086-15.474-22.695-26.23-40.827-26.23c-24.794,0-44.893,20.099-44.893,44.893 c0,17.308,9.8,32.318,24.15,39.811c-0.121,1.605-0.204,3.221-0.204,4.857c0,34.999,28.372,63.371,63.371,63.371 c6.395,0,12.564-0.956,18.384-2.718c13.198,14.733,32.363,24.011,53.699,24.011c39.811,0,72.084-32.273,72.084-72.084 S240.438,191.729,200.627,191.729z" />
            </G>
        </G>
    );
}

function Stage5({ dry, flowerCount, rng }: { dry: boolean; flowerCount: number; rng: () => number }) {
    const trunkA = dry ? DRY_TRUNK_MAIN : "#795548";
    const trunkB = dry ? DRY_TRUNK_SHADOW : "#5D4037";
    const c1 = dry ? "#6B4423" : "#4A8B3A";
    const c2 = dry ? DRY_BRANCH : "#68B954";
    const c3 = dry ? "#C49A5C" : "#8CE16E";
    const c4 = dry ? "#D9B380" : "#A8FA88";

    return (
        <G>
            <Path fill={trunkA} d="M248.985,512.001c-11.814,0-21.392-9.578-21.392-21.392V224.011c0-11.814,9.578-21.392,21.392-21.392 c11.814,0,21.392,9.578,21.392,21.392v266.598C270.377,502.424,260.799,512.001,248.985,512.001z" />
            <Path fill={trunkB} d="M248.985,490.609V224.011c0-7.913,4.308-14.806,10.696-18.507c-3.149-1.825-6.795-2.885-10.696-2.885 c-11.814,0-21.392,9.578-21.392,21.392v266.598c0,11.814,9.578,21.392,21.392,21.392c3.901,0,7.547-1.061,10.696-2.885 C253.293,505.415,248.985,498.523,248.985,490.609z" />
            <Ground />

            <Path fill={c1} d="M204.238,280.912c-10.934-14.73-28.457-24.278-48.211-24.278c-33.142,0-60.01,26.867-60.01,60.01 s26.867,60.01,60.01,60.01c6.732,0,13.197-1.125,19.239-3.17c7.221,4.1,15.562,6.453,24.458,6.453 c27.404,0,49.618-22.215,49.618-49.618C249.342,304.436,229.524,283.193,204.238,280.912z" />
            <G fill={c1}>
                <Path d="M399.965,158.283c0-27.919-9.67-54.277-26.63-75.144c-2.728-0.316-5.5-0.496-8.313-0.496 c-39.561,0-71.631,32.07-71.631,71.631c0,4.549,0.443,8.991,1.253,13.304c-40.745,7.042-71.746,42.535-71.746,85.291 c0,36.69,22.832,68.027,55.053,80.637c14.276-15.826,23.793-36.026,26.224-58.332C358.732,264.263,399.965,216,399.965,158.283z" />
                <Path d="M324.535,313.844c-3.424,0-6.572-2.26-7.548-5.718c-1.176-4.17,1.251-8.505,5.422-9.681 c17.307-4.881,30.522-19.483,33.669-37.199c0.758-4.267,4.832-7.117,9.097-6.353c4.266,0.757,7.111,4.831,6.353,9.097 c-4.193,23.602-21.801,43.056-44.859,49.559C325.958,313.747,325.241,313.844,324.535,313.844z" />
            </G>

            <Path fill={c2} d="M432.464,178.436c2.705-7.55,4.189-15.681,4.189-24.161c0-39.561-32.07-71.631-71.631-71.631 s-71.631,32.07-71.631,71.631c0,4.549,0.443,8.991,1.253,13.304c-40.745,7.042-71.746,42.535-71.746,85.291 c0,47.819,38.765,86.584,86.584,86.584c42.617,0,78.018-30.8,85.221-71.349c7.697,4.954,16.85,7.84,26.684,7.84 c27.274,0,49.386-22.111,49.386-49.386C470.776,203.094,454.405,183.465,432.464,178.436z" />
            <G fill={c2}>
                <Path d="M119.301,272.699c-14.349-7.492-24.15-22.502-24.15-39.811c0-23.215,17.623-42.313,40.221-44.651 c-2.244-0.241-4.519-0.377-6.828-0.377c-0.536,0-1.064,0.027-1.596,0.041c-7.085-15.474-22.695-26.23-40.827-26.23 c-24.794,0-44.893,20.099-44.893,44.893c0,17.308,9.8,32.318,24.151,39.811c-0.122,1.605-0.204,3.221-0.204,4.857 c0,34.999,28.372,63.371,63.371,63.371c0.834,0,1.663-0.018,2.49-0.05c-7.502-10.412-11.936-23.183-11.936-36.996 C119.097,275.92,119.18,274.304,119.301,272.699z" />
                <Path d="M200.627,191.729c-12.403,0-24.074,3.135-34.266,8.653c-10.557-7.863-23.642-12.519-37.818-12.519 c-0.536,0-1.064,0.027-1.596,0.041c-7.085-15.474-22.695-26.23-40.827-26.23c-4.694,0-9.219,0.723-13.471,2.06 c9.398,50.151,53.503,88.225,106.34,88.225c8.383,0,16.602-0.938,24.597-2.802c19.031,16.236,42.647,26.019,67.88,27.959 c0.805-4.312,1.245-8.754,1.245-13.3C272.712,224.002,240.438,191.729,200.627,191.729z" />
                <Circle cx="202.674" cy="294.61" r="19.929" />
            </G>

            <Path fill={c3} d="M200.627,191.729c-12.403,0-24.074,3.135-34.266,8.653c-10.556-7.863-23.642-12.519-37.818-12.519 c-0.536,0-1.064,0.027-1.596,0.041c-7.086-15.474-22.695-26.23-40.827-26.23c-24.794,0-44.893,20.099-44.893,44.893 c0,17.308,9.8,32.318,24.15,39.811c-0.121,1.605-0.204,3.221-0.204,4.857c0,34.999,28.372,63.371,63.371,63.371 c6.395,0,12.564-0.956,18.384-2.718c13.198,14.733,32.363,24.011,53.699,24.011c39.811,0,72.084-32.273,72.084-72.084 S240.438,191.729,200.627,191.729z" />
            <G fill={c3}>
                <Path d="M216.32,111.237c0.036,0,0.07,0.003,0.106,0.003c2-37.7,33.2-67.655,71.398-67.655 c11.14,0,21.683,2.549,31.081,7.093c-8.917-29.33-36.168-50.677-68.413-50.677c-38.199,0-69.398,29.955-71.398,67.655 c-0.036,0-0.07-0.003-0.106-0.003c-42.033,0-76.107,34.074-76.107,76.107c0,29.461,16.75,54.992,41.236,67.642 c-2.519-7.565-3.904-15.647-3.904-24.059C140.213,145.312,174.287,111.237,216.32,111.237z" />
                <Path d="M280.758,221.864c-4.334,0-7.846-3.513-7.846-7.846c0-4.333,3.512-7.846,7.846-7.846 c26.406,0,47.889-21.483,47.889-47.889c0-4.333,3.512-7.846,7.846-7.846c4.334,0,7.846,3.513,7.846,7.846 C344.339,193.342,315.816,221.864,280.758,221.864z" />
                <Circle cx="172.68" cy="184.512" r="19.929" />
                <Circle cx="272.714" cy="108.028" r="19.929" />
                <Circle cx="292.633" cy="151.098" r="7.6" />
                <Circle cx="222.592" cy="155.011" r="7.6" />
                <Circle cx="245.189" cy="193.928" r="7.6" />
            </G>

            <Path fill={c4} d="M321.327,81.187c0.429-3.168,0.671-6.396,0.671-9.682C321.997,32.015,289.984,0,250.492,0 c-38.199,0-69.398,29.955-71.398,67.655c-0.036,0-0.07-0.003-0.106-0.003c-42.033,0-76.107,34.074-76.107,76.107 s34.074,76.107,76.107,76.107c11.964,0,23.278-2.768,33.351-7.687c15.954,20.224,40.661,33.222,68.419,33.222 c48.115,0,87.12-39.005,87.12-87.12C367.878,124.82,349.002,95.781,321.327,81.187z" />

            {!dry && Array.from({ length: flowerCount }, (_, i) => {
                const pos = randomCrownPosition(rng);
                const colorIdx = Math.floor(rng() * FLOWER_COLORS.length);
                return <Flower key={i} x={pos.x} y={pos.y} colorIndex={colorIdx} />;
            })}
        </G>
    );
}

export default function TreeVisualization({ level, health, rescueMode, flowerCount = 0, size = 280 }: Props) {
    const swayAnim = useRef(new Animated.Value(0)).current;
    const scaleAnim = useRef(new Animated.Value(0.85)).current;

    useEffect(() => {
        Animated.spring(scaleAnim, {
            toValue: 1,
            friction: 4,
            tension: 30,
            useNativeDriver: true,
        }).start();

        Animated.loop(
            Animated.sequence([
                Animated.timing(swayAnim, { toValue: 2, duration: 2200, useNativeDriver: true }),
                Animated.timing(swayAnim, { toValue: -2, duration: 2200, useNativeDriver: true }),
                Animated.timing(swayAnim, { toValue: 0, duration: 2200, useNativeDriver: true }),
            ])
        ).start();
    }, [level]);

    const stage = Math.max(1, Math.min(5, level));
    const dry = rescueMode;

    const today = new Date().toISOString().split("T")[0];
    const seedBase = today.split("-").reduce((acc, v) => acc + parseInt(v), 0);
    const rng = seededRandom(seedBase);

    return (
        <Animated.View style={{
            transform: [
                { translateX: swayAnim },
                { scale: scaleAnim },
            ],
        }}>
            <Svg width={size} height={size} viewBox="0 0 512 512">
                {stage === 1 && <Stage1 dry={dry} />}
                {stage === 2 && <Stage2 dry={dry} />}
                {stage === 3 && <Stage3 dry={dry} />}
                {stage === 4 && <Stage4 dry={dry} />}
                {stage >= 5 && <Stage5 dry={dry} flowerCount={flowerCount} rng={rng} />}
            </Svg>
        </Animated.View>
    );
}