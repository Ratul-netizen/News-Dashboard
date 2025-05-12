import { Typography, Box, List, ListItem, ListItemText } from '@mui/material';

const ExecutiveSummary = () => {
  const keyFindings = [
    "Security concerns dominate coverage, particularly regarding immigration and border issues",
    "Diplomatic relations between India and Bangladesh remain a significant focus",
    "Minority issues receive substantial attention in both English and Bengali press",
    "Notable differences in coverage between English and Bengali newspapers",
    "Significant events include the Pahalgam attack and its impact on bilateral relations"
  ];

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Executive Summary
      </Typography>
      <List>
        {keyFindings.map((finding, index) => (
          <ListItem key={index} sx={{ py: 0.5 }}>
            <ListItemText primary={finding} />
          </ListItem>
        ))}
      </List>
    </Box>
  );
};

export default ExecutiveSummary; 