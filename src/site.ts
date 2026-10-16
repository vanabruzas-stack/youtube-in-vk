import { installSkin } from './shared';
import { enhanceSite, restoreSite } from './site-enhance';
import { enhanceRecommendations, restoreRecommendations } from './recommendations';
import { enhanceSiteMetrics, restoreSiteMetrics } from './local-metrics';
installSkin('site', () => { enhanceSite(); enhanceRecommendations(); enhanceSiteMetrics(); }, () => { restoreSite(); restoreRecommendations(); restoreSiteMetrics(); });
