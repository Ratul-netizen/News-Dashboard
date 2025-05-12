import React from 'react';
import { Typography, Box, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper } from '@mui/material';

const LanguagePressComparison = () => {
  const comparisonData = [
    {
      aspect: 'Security Coverage',
      english: 'High focus on border security and immigration',
      bengali: 'More emphasis on human rights aspects'
    },
    {
      aspect: 'Diplomatic Relations',
      english: 'Formal diplomatic meetings and official statements',
      bengali: 'Cultural and people-to-people relations'
    },
    {
      aspect: 'Minority Issues',
      english: 'Legal and policy perspectives',
      bengali: 'Community impact and social aspects'
    },
    {
      aspect: 'Tone',
      english: 'More formal and analytical',
      bengali: 'More emotional and community-focused'
    }
  ];

  return (
    <Box>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Aspect</TableCell>
              <TableCell>English Press</TableCell>
              <TableCell>Bengali Press</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {comparisonData.map((row, index) => (
              <TableRow key={index}>
                <TableCell component="th" scope="row">
                  {row.aspect}
                </TableCell>
                <TableCell>{row.english}</TableCell>
                <TableCell>{row.bengali}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default LanguagePressComparison; 