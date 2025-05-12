import { Container, Grid, Paper, Typography, Tabs, Tab, Box, CircularProgress } from '@mui/material';
import { useState, Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import ErrorBoundary from './components/ErrorBoundary';

// Lazy load all components
const ExecutiveSummary = lazy(() => import('./components/ExecutiveSummary'));
const KeyThemesSummary = lazy(() => import('./components/KeyThemesSummary'));
const TimelineEvents = lazy(() => import('./components/TimelineEvents'));
const CoverageByNewspaper = lazy(() => import('./components/CoverageByNewspaper'));
const LanguagePressComparison = lazy(() => import('./components/LanguagePressComparison'));
const KeySources = lazy(() => import('./components/KeySources'));
const SentimentAnalysis = lazy(() => import('./components/SentimentAnalysis'));
const DeeperImplications = lazy(() => import('./components/DeeperImplications'));
const PostAnalysis = lazy(() => import('./components/PostAnalysis'));
const NewsPostAnalysis = lazy(() => import('./components/NewsPostAnalysis'));

import './App.css';

// Loading component
const LoadingComponent = () => (
  <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
    <CircularProgress />
  </Box>
);

function TabPanel({ children, value, index }) {
  return (
    <div hidden={value !== index} style={{ width: '100%' }}>
      {value === index && children}
    </div>
  );
}

function DashboardContent() {
  const [tabValue, setTabValue] = useState(0);
  const navigate = useNavigate();
  const location = useLocation();

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
    if (newValue === 0) {
      navigate('/');
    } else {
      navigate('/posts');
    }
  };

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Typography variant="h3" component="h1" gutterBottom align="center" sx={{ mb: 4, color: 'text.primary' }}>
        Bangladesh News Analysis (Latest dates, 2025) in Indian Newspapers
      </Typography>

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs 
          value={tabValue} 
          onChange={handleTabChange} 
          centered
          sx={{
            '& .MuiTab-root': {
              fontSize: '1.1rem',
              fontWeight: 500,
            }
          }}
        >
          <Tab label="NEWS ANALYSIS" />
          <Tab label="SOCIAL MEDIA POSTS" />
        </Tabs>
      </Box>

      <TabPanel value={tabValue} index={0}>
        <Grid container spacing={3}>
          {/* Executive Summary */}
          <Grid item xs={12}>
            <ErrorBoundary>
              <Suspense fallback={<LoadingComponent />}>
                <Paper sx={{ p: 3, mb: 3 }}>
                  <Typography variant="h5" gutterBottom sx={{ mb: 2 }}>
                    Executive Summary
                  </Typography>
                  <ExecutiveSummary />
                </Paper>
              </Suspense>
            </ErrorBoundary>
          </Grid>

          {/* Key Themes and Timeline */}
          <Grid item xs={12} md={6}>
            <ErrorBoundary>
              <Suspense fallback={<LoadingComponent />}>
                <Paper sx={{ p: 3, height: '100%' }}>
                  <Typography variant="h5" gutterBottom sx={{ mb: 2 }}>
                    Key Themes Analysis
                  </Typography>
                  <KeyThemesSummary />
                </Paper>
              </Suspense>
            </ErrorBoundary>
          </Grid>
          <Grid item xs={12} md={6}>
            <ErrorBoundary>
              <Suspense fallback={<LoadingComponent />}>
                <Paper sx={{ p: 3, height: '100%' }}>
                  <Typography variant="h5" gutterBottom sx={{ mb: 2 }}>
                    Timeline of Key Events
                  </Typography>
                  <TimelineEvents />
                </Paper>
              </Suspense>
            </ErrorBoundary>
          </Grid>

          {/* Coverage Analysis */}
          <Grid item xs={12} md={6}>
            <ErrorBoundary>
              <Suspense fallback={<LoadingComponent />}>
                <Paper sx={{ p: 3, height: '100%' }}>
                  <Typography variant="h5" gutterBottom sx={{ mb: 2 }}>
                    Coverage by Newspaper
                  </Typography>
                  <CoverageByNewspaper />
                </Paper>
              </Suspense>
            </ErrorBoundary>
          </Grid>
          <Grid item xs={12} md={6}>
            <ErrorBoundary>
              <Suspense fallback={<LoadingComponent />}>
                <Paper sx={{ p: 3, height: '100%' }}>
                  <Typography variant="h5" gutterBottom sx={{ mb: 2 }}>
                    Language Press Comparison
                  </Typography>
                  <LanguagePressComparison />
                </Paper>
              </Suspense>
            </ErrorBoundary>
          </Grid>

          {/* Sources and Sentiment */}
          <Grid item xs={12} md={6}>
            <ErrorBoundary>
              <Suspense fallback={<LoadingComponent />}>
                <Paper sx={{ p: 3, height: '100%' }}>
                  <Typography variant="h5" gutterBottom sx={{ mb: 2 }}>
                    Key Sources Used
                  </Typography>
                  <KeySources />
                </Paper>
              </Suspense>
            </ErrorBoundary>
          </Grid>
          <Grid item xs={12} md={6}>
            <ErrorBoundary>
              <Suspense fallback={<LoadingComponent />}>
                <Paper sx={{ p: 3, height: '100%' }}>
                  <Typography variant="h5" gutterBottom sx={{ mb: 2 }}>
                    Tone/Sentiment Analysis
                  </Typography>
                  <SentimentAnalysis />
                </Paper>
              </Suspense>
            </ErrorBoundary>
          </Grid>

          {/* Deeper Implications */}
          <Grid item xs={12}>
            <ErrorBoundary>
              <Suspense fallback={<LoadingComponent />}>
                <Paper sx={{ p: 3 }}>
                  <Typography variant="h5" gutterBottom sx={{ mb: 2 }}>
                    Deeper Implications/Trends
                  </Typography>
                  <DeeperImplications />
                </Paper>
              </Suspense>
            </ErrorBoundary>
          </Grid>
        </Grid>
      </TabPanel>

      <TabPanel value={tabValue} index={1}>
        <ErrorBoundary>
          <Suspense fallback={<LoadingComponent />}>
            <Paper sx={{ p: 3, minHeight: 'calc(100vh - 200px)' }}>
              <PostAnalysis />
            </Paper>
          </Suspense>
        </ErrorBoundary>
      </TabPanel>
    </Container>
  );
}

function App() {
  return (
    <Router>
      <ErrorBoundary>
        <Suspense fallback={<LoadingComponent />}>
          <Routes>
            <Route path="/" element={<DashboardContent />} />
            <Route path="/posts" element={<DashboardContent />} />
            <Route path="/post/:postId" element={<NewsPostAnalysis />} />
          </Routes>
        </Suspense>
      </ErrorBoundary>
    </Router>
  );
}

export default App;
