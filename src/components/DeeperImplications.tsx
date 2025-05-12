import { Typography, Box, List, ListItem, ListItemIcon, ListItemText } from '@mui/material';
import { Security, TrendingUp, Public, School } from '@mui/icons-material';

const DeeperImplications = () => {
  const implications = [
    {
      title: 'Securitization of Narratives',
      icon: <Security />,
      description: 'Increasing focus on security aspects in bilateral relations'
    },
    {
      title: 'Pahalgam Attack Impact',
      icon: <TrendingUp />,
      description: 'Significant influence on media coverage and diplomatic discourse'
    },
    {
      title: 'Post-Hasina Transition',
      icon: <Public />,
      description: 'Media attention on political transition and its implications'
    },
    {
      title: 'Regional Press Role',
      icon: <School />,
      description: 'Growing importance of regional press in shaping narratives'
    }
  ];

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Deeper Implications/Trends
      </Typography>
      <List>
        {implications.map((implication, index) => (
          <ListItem key={index}>
            <ListItemIcon>
              {implication.icon}
            </ListItemIcon>
            <ListItemText
              primary={implication.title}
              secondary={implication.description}
            />
          </ListItem>
        ))}
      </List>
    </Box>
  );
};

export default DeeperImplications; 