import React, { useState, useEffect } from 'react';
import { 
  Paper, 
  Typography, 
  Box,
  CircularProgress,
  Chip,
  Grid,
  Avatar
} from '@mui/material';
import { useNavigate } from 'react-router-dom';

const PLATFORM_APIS = {
  Facebook: 'http://192.168.100.35:8051/post/list/?platform=F',
  Instagram: 'http://192.168.100.35:8051/post/list/?platform=I',
  X: 'http://192.168.100.35:8051/post/list/?platform=X',
  YouTube: 'http://192.168.100.35:8051/post/list/?platform=Y',
  Telegram: 'http://192.168.100.35:8051/post/list/?platform=T',
};

const PostAnalysis = () => {
  const [allPosts, setAllPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchAllPosts = async () => {
      setLoading(true);
      let all = [];
      await Promise.all(
        Object.entries(PLATFORM_APIS).map(async ([platform, url]) => {
          try {
            const response = await fetch(url);
            const data = await response.json();
            // Attach platform info to each post
            const postsWithPlatform = (data || []).map(post => ({ ...post, platform }));
            all = all.concat(postsWithPlatform);
          } catch (error) {
            // skip on error
          }
        })
      );
      // Sort by posted_at descending
      all.sort((a, b) => new Date(b.posted_at) - new Date(a.posted_at));
      setAllPosts(all);
      setLoading(false);
    };
    fetchAllPosts();
  }, []);

  const handlePostClick = (platform, post) => {
    navigate(`/post/${platform}-${post._id}`, { state: { post, platform } });
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ height: '100%', overflow: 'auto' }}>
      <Typography variant="h5" gutterBottom sx={{ mb: 3 }}>
        Latest News Posts (All Platforms)
      </Typography>
      <Grid container spacing={2}>
        {allPosts.length > 0 ? allPosts.map((post) => (
          <Grid item xs={12} key={post._id}>
            <Paper 
              sx={{ 
                p: 2, 
                cursor: 'pointer',
                '&:hover': {
                  backgroundColor: 'action.hover'
                }
              }}
              onClick={() => handlePostClick(post.platform, post)}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                {post.url_screenshot && (
                  <Avatar src={post.url_screenshot} alt="screenshot" sx={{ width: 56, height: 56, mr: 2 }} />
                )}
                <Box>
                  <Typography variant="h6" gutterBottom>
                    {post.post_text?.slice(0, 40) || 'Untitled'}
                  </Typography>
                  <Box sx={{ mb: 1 }}>
                    <Chip label={post.platform} size="small" sx={{ mr: 1 }} />
                    {post.source && <Chip label={post.source} size="small" sx={{ mr: 1 }} />}
                    {post.posted_at && (
                      <Chip label={post.posted_at} size="small" variant="outlined" />
                    )}
                  </Box>
                </Box>
              </Box>
              <Typography variant="body2" color="text.secondary" noWrap>
                {post.post_text?.slice(0, 100) || ''}
              </Typography>
            </Paper>
          </Grid>
        )) : (
          <Typography variant="body2" color="text.secondary" sx={{ ml: 2 }}>
            No posts found.
          </Typography>
        )}
      </Grid>
    </Box>
  );
};

export default PostAnalysis; 