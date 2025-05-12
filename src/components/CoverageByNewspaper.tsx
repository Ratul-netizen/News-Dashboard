import React from 'react';
import { Typography, Box } from '@mui/material';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const CoverageByNewspaper = () => {
  const data = [
    { name: 'The Statesman', articles: 15 },
    { name: 'The Indian Express', articles: 12 },
    { name: 'Times of India', articles: 10 },
    { name: 'Sangbad Pratidin', articles: 8 },
    { name: 'Bartaman Patrika', articles: 7 }
  ];

  return (
    <Box>
      <Box sx={{ height: 300 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" angle={-45} textAnchor="end" height={70} />
            <YAxis />
            <Tooltip />
            <Bar dataKey="articles" fill="#8884d8" />
          </BarChart>
        </ResponsiveContainer>
      </Box>
    </Box>
  );
};

export default CoverageByNewspaper; 