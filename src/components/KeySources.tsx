import React from 'react';
import { Typography, Box, List, ListItem, ListItemIcon, ListItemText } from '@mui/material';
import { Person, Business, Gavel, Public, School } from '@mui/icons-material';

const KeySources = () => {
  const sources = [
    {
      type: 'Government Officials',
      icon: <Person />,
      description: 'Ministry statements, press releases, and official communications'
    },
    {
      type: 'Diplomatic Sources',
      icon: <Business />,
      description: 'Embassy statements and diplomatic communications'
    },
    {
      type: 'Legal Documents',
      icon: <Gavel />,
      description: 'Court orders, legal proceedings, and official documents'
    },
    {
      type: 'RSS',
      icon: <Public />,
      description: 'Press releases and official statements'
    },
    {
      type: 'Academic Sources',
      icon: <School />,
      description: 'Research papers and expert opinions'
    }
  ];

  return (
    <Box>
      <List>
        {sources.map((source, index) => (
          <ListItem key={index}>
            <ListItemIcon>
              {source.icon}
            </ListItemIcon>
            <ListItemText
              primary={source.type}
              secondary={source.description}
            />
          </ListItem>
        ))}
      </List>
    </Box>
  );
};

export default KeySources; 