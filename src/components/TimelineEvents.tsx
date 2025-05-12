import React from 'react';
import { Typography, Box } from '@mui/material';
import { Timeline, TimelineItem, TimelineSeparator, TimelineConnector, TimelineContent, TimelineDot } from '@mui/lab';
import { Event as EventIcon } from '@mui/icons-material';

const TimelineEvents = () => {
  const events = [
    {
      date: 'April 28',
      title: '5 Bangladeshis Pushed Back from Assam',
      description: 'Border security incident reported in multiple newspapers'
    },
    {
      date: 'April 28',
      title: 'Modi-Yunus Meet in Bangkok',
      description: 'Diplomatic meeting between Indian PM and Bangladeshi Nobel laureate'
    },
    {
      date: 'April 28',
      title: 'Bangladesh vs Zimbabwe Cricket',
      description: 'Sports coverage in regional press'
    },
    {
      date: 'May 2',
      title: 'Ex-Bangladesh General\'s Statement',
      description: 'Controversial statement reported in Sangbad Pratidin'
    },
    {
      date: 'May 5',
      title: 'Demolition of Bangladeshi Immigrants\' Homes',
      description: 'Major incident in Ahmedabad reported across newspapers'
    },
    {
      date: 'May 5',
      title: 'Arrest of Chinmoy Krishnadas',
      description: 'Security-related incident covered extensively'
    }
  ];

  return (
    <Box>
      <Timeline position="alternate">
        {events.map((event, index) => (
          <TimelineItem key={index}>
            <TimelineSeparator>
              <TimelineDot color="primary">
                <EventIcon />
              </TimelineDot>
              {index < events.length - 1 && <TimelineConnector />}
            </TimelineSeparator>
            <TimelineContent>
              <Typography variant="subtitle2" color="text.secondary">
                {event.date}
              </Typography>
              <Typography variant="subtitle1" component="span">
                {event.title}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {event.description}
              </Typography>
            </TimelineContent>
          </TimelineItem>
        ))}
      </Timeline>
    </Box>
  );
};

export default TimelineEvents; 