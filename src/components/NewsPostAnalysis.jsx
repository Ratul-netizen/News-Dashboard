import React, { useState, useEffect } from 'react';
import { Container, Grid, Paper, Typography, Box, CircularProgress, Chip, Avatar, Link } from '@mui/material';
import { useParams, useLocation } from 'react-router-dom';

const NewsPostAnalysis = () => {
  const { postId } = useParams();
  const location = useLocation();
  const [post, setPost] = useState(location.state?.post || null);
  const [loading, setLoading] = useState(!location.state?.post);

  useEffect(() => {
    if (!post) {
      // Fallback: try to fetch post by ID (not implemented, as API does not support single post fetch)
      setLoading(false);
    }
  }, [post]);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
        <CircularProgress />
      </Box>
    );
  }

  if (!post) {
    return (
      <Container>
        <Typography variant="h5" color="error">
          Post not found
        </Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom align="center" sx={{ mb: 4 }}>
        News Post Analysis
      </Typography>
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          {post.url_screenshot && (
            <Avatar src={post.url_screenshot} alt="screenshot" sx={{ width: 80, height: 80, mr: 3 }} />
          )}
          <Box>
            <Typography variant="h6" gutterBottom>
              {post.post_text?.slice(0, 80) || 'Untitled'}
            </Typography>
            <Box sx={{ mb: 1 }}>
              {post.platform && <Chip label={post.platform} size="small" sx={{ mr: 1 }} />}
              {post.source && <Chip label={post.source} size="small" sx={{ mr: 1 }} />}
              {post.posted_at && <Chip label={post.posted_at} size="small" variant="outlined" />}
            </Box>
            {post.post_url && (
              <Link href={post.post_url} target="_blank" rel="noopener" underline="hover">
                View Original Post
              </Link>
            )}
          </Box>
        </Box>
        <Typography variant="body1" paragraph>
          {post.post_text}
        </Typography>
      </Paper>
      <Grid container spacing={3}>
        {/* Reactions */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Reactions
            </Typography>
            {post.reactions ? (
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {Object.entries(post.reactions).map(([key, value]) => (
                  key !== 'Total' && value != null ? (
                    <Chip key={key} label={`${key}: ${value}`} />
                  ) : null
                ))}
                <Chip label={`Total: ${post.reactions.Total || 0}`} color="primary" />
              </Box>
            ) : (
              <Typography variant="body2" color="text.secondary">No reactions data.</Typography>
            )}
          </Paper>
        </Grid>
        {/* Screenshot */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h6" gutterBottom>
              Screenshot
            </Typography>
            {post.url_screenshot ? (
              <img src={post.url_screenshot} alt="screenshot" style={{ maxWidth: '100%', maxHeight: 200 }} />
            ) : (
              <Typography variant="body2" color="text.secondary">No screenshot available.</Typography>
            )}
          </Paper>
        </Grid>
        {/* Additional Info */}
        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Additional Info
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
              <Typography variant="body2">Total Comments: {post.total_comments ?? 'N/A'}</Typography>
              <Typography variant="body2">Total Shares: {post.total_shares ?? 'N/A'}</Typography>
              <Typography variant="body2">Total Views: {post.total_views ?? 'N/A'}</Typography>
              <Typography variant="body2">Total Reactions: {post.total_reactions ?? 'N/A'}</Typography>
              <Typography variant="body2">Vitality Score: {post.vitality_score ?? 'N/A'}</Typography>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default NewsPostAnalysis; 