import { installSkin } from './shared';
import { enhanceStudioMetrics, restoreStudioMetrics } from './local-metrics';
import { enhanceStudio, restoreStudio } from './studio-enhance';
installSkin('studio', () => { enhanceStudio(); enhanceStudioMetrics(); }, () => { restoreStudio(); restoreStudioMetrics(); });
