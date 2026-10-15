import { installSkin } from './shared';
import { enhanceSite, restoreSite } from './site-enhance';
import { enhanceRecommendations, restoreRecommendations } from './recommendations';
installSkin('site', () => { enhanceSite(); enhanceRecommendations(); }, () => { restoreSite(); restoreRecommendations(); });
