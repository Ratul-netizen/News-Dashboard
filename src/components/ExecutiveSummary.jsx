import React from 'react';
import { List, ListItem, ListItemText, Box } from '@mui/material';
import CircleIcon from '@mui/icons-material/Circle';

const summaryPoints = [
  'Security concerns dominate coverage, particularly regarding immigration and border issues',
  'Diplomatic relations between India and Bangladesh remain a significant focus',
  'Minority issues receive substantial attention in both English and Bengali press',
  'Notable differences in coverage between English and Bengali newspapers',
  'Significant events include the Pahalgam attack and its impact on bilateral relations'
];

const ExecutiveSummary = () => {
  return (
    <List>
      {summaryPoints.map((point, index) => (
        <ListItem 
          key={index}
          sx={{
            py: 1,
            '&:hover': {
              backgroundColor: 'action.hover'
            }
          }}
        >
          <CircleIcon 
            sx={{ 
              fontSize: 8, 
              mr: 2,
              color: 'text.secondary'
            }} 
          />
          <ListItemText 
            primary={point}
            primaryTypographyProps={{
              variant: 'body1',
              color: 'text.primary'
            }}
          />
        </ListItem>
      ))}
    </List>
  );
};

export default ExecutiveSummary; 