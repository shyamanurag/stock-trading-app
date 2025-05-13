import { Link } from 'react-router-dom';

// Add a button to view analytics
<Link to={`/analytics?strategyId=${strategy.id}`}>
  <Button>
    <BarChart3 className="h-4 w-4 mr-2" />
    View Analytics
  </Button>
</Link>
