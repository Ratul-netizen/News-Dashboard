import React, { useEffect, useRef } from 'react';
import { Typography, Box, Paper } from '@mui/material';
import * as d3 from 'd3';
import cloud from 'd3-cloud';
import 'tippy.js/dist/tippy.css';
import 'tippy.js/animations/scale.css';
import tippy from 'tippy.js';

// Define the Word type
type Word = {
  text: string;
  value: number;
  size?: number;
  x?: number;
  y?: number;
  rotate?: number;
};

const KeyThemesSummary = () => {
  const svgRef = useRef<SVGSVGElement | null>(null);

  useEffect(() => {
    const words: Word[] = [
      { text: "Security", value: 100 },
      { text: "Immigration", value: 80 },
      { text: "Diplomacy", value: 70 },
      { text: "Border", value: 65 },
      { text: "Minority", value: 60 },
      { text: "Relations", value: 55 },
      { text: "Trade", value: 50 },
      { text: "Culture", value: 45 },
      { text: "Development", value: 40 },
      { text: "Cooperation", value: 35 }
    ];

    const width = 600;
    const height = 400;

    // Clear previous content
    d3.select(svgRef.current).selectAll("*").remove();

    const svg = d3.select(svgRef.current)
      .attr("width", width)
      .attr("height", height)
      .append("g")
      .attr("transform", `translate(${width/2},${height/2})`);

    const layout = cloud<Word>()
      .size([width, height])
      .words(words)
      .padding(5)
      .rotate(() => ~~(Math.random() * 2) * 90)
      .font("Arial")
      .fontSize((d: Word) => d.value / 2)
      .on("end", draw);

    layout.start();

    function draw(words: Word[]) {
      svg.selectAll("text")
        .data(words)
        .enter().append("text")
        .style("font-size", (d: Word) => `${d.size}px`)
        .style("font-family", "Arial")
        .style("fill", () => d3.schemeCategory10[~~(Math.random() * 10)])
        .attr("text-anchor", "middle")
        .attr("transform", (d: Word) => `translate(${d.x},${d.y}) rotate(${d.rotate})`)
        .text((d: Word) => d.text)
        .each(function(d: Word) {
          tippy(this, {
            content: `Frequency: ${d.value}`,
            animation: 'scale'
          });
        });
    }
  }, []);

  return (
    <Box>
      <Paper sx={{ p: 2, display: 'flex', justifyContent: 'center' }}>
        <svg ref={svgRef}></svg>
      </Paper>
    </Box>
  );
};

export default KeyThemesSummary; 