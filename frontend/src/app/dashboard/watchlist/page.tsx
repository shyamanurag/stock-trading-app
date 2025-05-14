RefreshCw, 
  Search, 
  Trash2, 
  AlertCircle,
  X,
  Save,
  Star,
  MoreHorizontal,
  ArrowRightCircle
} from 'lucide-react';
import { tradingApiService, Watchlist as WatchlistType } from '@/services/trading-api.service';
import webSocketService from '@/services/websocket.service';

// Mock data for initial development
const mockWatchlists = [
  {
    id: '1',
    name: 'Default',
    symbols: ['RELIANCE', 'TCS', 'HDFCBANK', 'INFY', 'ICICIBANK'],
    isDefault: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '2',
    name: 'IT Stocks',
    symbols: ['TCS', 'INFY', 'WIPRO', 'HCLTECH', 'TECHM'],
    isDefault: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '3',
    name: 'Banking',
    symbols: ['HDFCBANK', 'ICICIBANK', 'SBIN', 'AXISBANK', 'KOTAKBANK'],
    isDefault: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

const mockStocksData = {
  'RELIANCE': { name: 'Reliance Industries Ltd.', ltp: '2456.75', change: '+11.50', changePercent: '+0.47%', trend: 'up' },
  'TCS': { name: 'Tata Consultancy Services Ltd.', ltp: '3552.80', change: '-28.45', changePercent: '-0.79%', trend: 'down' },
  'HDFCBANK': { name: 'HDFC Bank Ltd.', ltp: '1675.20', change: '+8.65', changePercent: '+0.52%', trend: 'up' },
  'INFY': { name: 'Infosys Ltd.', ltp: '1452.35', change: '-12.75', changePercent: '-0.87%', trend: 'down' },
  'ICICIBANK': { name: 'ICICI Bank Ltd.', ltp: '945.50', change: '+5.30', changePercent: '+0.56%', trend: 'up' },
  'WIPRO': { name: 'Wipro Ltd.', ltp: '432.75', change: '-3.25', changePercent: '-0.74%', trend: 'down' },
  'HCLTECH': { name: 'HCL Technologies Ltd.', ltp: '1175.60', change: '+8.75', changePercent: '+0.75%', trend: 'up' },
  'TECHM': { name: 'Tech Mahindra Ltd.', ltp: '1245.30', change: '+15.45', changePercent: '+1.26%', trend: 'up' },
  'SBIN': { name: 'State Bank of India', ltp: '576.45', change: '+3.75', changePercent: '+0.65%', trend: 'up' },
  'AXISBANK': { name: 'Axis Bank Ltd.', ltp: '865.20', change: '-4.50', changePercent: '-0.52%', trend: 'down' },
  'KOTAKBANK': { name: 'Kotak Mahindra Bank Ltd.', ltp: '1745.85', change: '+12.30', changePercent: '+0.71%', trend: 'up' },
};

interface StockData {
  name: string;
  ltp: string;
  change: string;
  changePercent: string;
  trend: 'up' | 'down';
}

export default function WatchlistPage() {
  const [watchlists, setWatchlists] = useState<WatchlistType[]>(mockWatchlists as unknown as WatchlistType[]);
  const [selectedWatchlist, setSelectedWatchlist] = useState<WatchlistType | null>(null);
  const [isAddingWatchlist, setIsAddingWatchlist] = useState(false);
  const [isEditingWatchlist, setIsEditingWatchlist] = useState(false);
  const [newWatchlistName, setNewWatchlistName] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<{ symbol: string; name: string }[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stocksData, setStocksData] = useState<Record<string, StockData>>(mockStocksData);
  const [isLoading, setIsLoading] = useState(false);
  const [isAddSymbolModalOpen, setIsAddSymbolModalOpen] = useState(false);

  useEffect(() => {
    // Initial selection of default watchlist
    if (watchlists.length > 0) {
      const defaultWatchlist = watchlists.find(w => w.isDefault) || watchlists[0];
      setSelectedWatchlist(defaultWatchlist);
    }

    // In a real app, fetch watchlists from API
    fetchWatchlists();

    // Connect to WebSocket for real-time updates
    setupWebSocket();

    return () => {
      // Cleanup WebSocket connections
      webSocketService.disconnect();
    };
  }, []);

  // Fetch watchlists from API
  const fetchWatchlists = async () => {
    setIsLoading(true);
    try {
      // In a real implementation, uncomment this:
      // const response = await tradingApiService.getWatchlists();
      // if (response.success) {
      //   setWatchlists(response.data);
      //   if (response.data.length > 0) {
      //     const defaultWatchlist = response.data.find(w => w.isDefault) || response.data[0];
      //     setSelectedWatchlist(defaultWatchlist);
      //   }
      // } else {
      //   setError(response.error || 'Failed to fetch watchlists');
      // }
      
      // Using mock data for now
      setWatchlists(mockWatchlists as unknown as WatchlistType[]);
      setIsLoading(false);
    } catch (err: any) {
      setError('Failed to fetch watchlists: ' + err.message);
      setIsLoading(false);
    }
  };

  // Setup WebSocket for real-time price updates
  const setupWebSocket = () => {
    // Connect to WebSocket server
    webSocketService.connect().then(() => {
      // Subscribe to market data updates
      if (selectedWatchlist) {
        subscribeToSymbols(selectedWatchlist.symbols);
      }

      // Set up event handler for quote updates
      webSocketService.on('quote', (message) => {
        if (message.data) {
          updateStockData(message.data);
        }
      });
    }).catch(err => {
      console.error('Failed to connect to WebSocket:', err);
    });
  };

  // Subscribe to symbols for real-time updates
  const subscribeToSymbols = (symbols: string[]) => {
    symbols.forEach(symbol => {
      webSocketService.subscribe({
        topic: 'quote',
        symbol,
        exchange: 'NSE'
      });
    });
  };

  // Update stock data when receiving real-time updates
  const updateStockData = (quoteData: any) => {
    const { symbol, lastPrice, change, changePercent } = quoteData;
    
    setStocksData(prev => ({
      ...prev,
      [symbol]: {
        ...prev[symbol],
        ltp: lastPrice.toFixed(2),
        change: change >= 0 ? `+${change.toFixed(2)}` : change.toFixed(2),
        changePercent: changePercent >= 0 ? `+${changePercent.toFixed(2)}%` : `${changePercent.toFixed(2)}%`,
        trend: change >= 0 ? 'up' : 'down'
      }
    }));
  };

  // Handle watchlist selection
  const handleSelectWatchlist = (watchlist: WatchlistType) => {
    setSelectedWatchlist(watchlist);
    
    // Subscribe to the symbols in the selected watchlist
    if (webSocketService.isConnected()) {
      subscribeToSymbols(watchlist.symbols);
    }
  };

  // Create a new watchlist
  const handleCreateWatchlist = async () => {
    if (!newWatchlistName.trim()) {
      setError('Watchlist name cannot be empty');
      return;
    }

    try {
      // In a real implementation, uncomment this:
      // const response = await tradingApiService.createWatchlist({
      //   name: newWatchlistName,
      //   symbols: []
      // });
      
      // if (response.success) {
      //   setWatchlists([...watchlists, response.data]);
      //   setSelectedWatchlist(response.data);
      //   setNewWatchlistName('');
      //   setIsAddingWatchlist(false);
      // } else {
      //   setError(response.error || 'Failed to create watchlist');
      // }
      
      // Using mock data for now
      const newWatchlist = {
        id: `${watchlists.length + 1}`,
        name: newWatchlistName,
        symbols: [],
        isDefault: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      
      setWatchlists([...watchlists, newWatchlist as unknown as WatchlistType]);
      setSelectedWatchlist(newWatchlist as unknown as WatchlistType);
      setNewWatchlistName('');
      setIsAddingWatchlist(false);
    } catch (err: any) {
      setError('Failed to create watchlist: ' + err.message);
    }
  };

  // Update watchlist name
  const handleUpdateWatchlist = async () => {
    if (!selectedWatchlist) return;
    if (!newWatchlistName.trim()) {
      setError('Watchlist name cannot be empty');
      return;
    }

    try {
      // In a real implementation, uncomment this:
      // const response = await tradingApiService.updateWatchlist(selectedWatchlist.id, {
      //   name: newWatchlistName
      // });
      
      // if (response.success) {
      //   setWatchlists(watchlists.map(w => w.id === selectedWatchlist.id ? response.data : w));
      //   setSelectedWatchlist(response.data);
      //   setNewWatchlistName('');
      //   setIsEditingWatchlist(false);
      // } else {
      //   setError(response.error || 'Failed to update watchlist');
      // }
      
      // Using mock data for now
      const updatedWatchlist = {
        ...selectedWatchlist,
        name: newWatchlistName,
        updatedAt: new Date().toISOString()
      };
      
      setWatchlists(watchlists.map(w => w.id === selectedWatchlist.id ? updatedWatchlist as unknown as WatchlistType : w));
      setSelectedWatchlist(updatedWatchlist as unknown as WatchlistType);
      setNewWatchlistName('');
      setIsEditingWatchlist(false);
    } catch (err: any) {
      setError('Failed to update watchlist: ' + err.message);
    }
  };

  // Delete a watchlist
  const handleDeleteWatchlist = async (watchlistId: string) => {
    if (confirm('Are you sure you want to delete this watchlist?')) {
      try {
        // In a real implementation, uncomment this:
        // const response = await tradingApiService.deleteWatchlist(watchlistId);
        
        // if (response.success) {
        //   const updatedWatchlists = watchlists.filter(w => w.id !== watchlistId);
        //   setWatchlists(updatedWatchlists);
        //   
        //   if (selectedWatchlist?.id === watchlistId) {
        //     setSelectedWatchlist(updatedWatchlists.length > 0 ? updatedWatchlists[0] : null);
        //   }
        // } else {
        //   setError(response.error || 'Failed to delete watchlist');
        // }
        
        // Using mock data for now
        const updatedWatchlists = watchlists.filter(w => w.id !== watchlistId);
        setWatchlists(updatedWatchlists);
        
        if (selectedWatchlist?.id === watchlistId) {
          setSelectedWatchlist(updatedWatchlists.length > 0 ? updatedWatchlists[0] : null);
        }
      } catch (err: any) {
        setError('Failed to delete watchlist: ' + err.message);
      }
    }
  };

  // Add symbol to watchlist
  const handleAddSymbol = async (symbol: string) => {
    if (!selectedWatchlist) return;
    if (selectedWatchlist.symbols.includes(symbol)) {
      setError(`${symbol} is already in this watchlist`);
      return;
    }

    try {
      // In a real implementation, uncomment this:
      // const response = await tradingApiService.updateWatchlist(selectedWatchlist.id, {
      //   symbols: [...selectedWatchlist.symbols, symbol]
      // });
      
      // if (response.success) {
      //   setWatchlists(watchlists.map(w => w.id === selectedWatchlist.id ? response.data : w));
      //   setSelectedWatchlist(response.data);
      //   
      //   // Subscribe to the new symbol
      //   if (webSocketService.isConnected()) {
      //     webSocketService.subscribe({
      //       topic: 'quote',
      //       symbol,
      //       exchange: 'NSE'
      //     });
      //   }
      // } else {
      //   setError(response.error || 'Failed to add symbol to watchlist');
      // }
      
      // Using mock data for now
      const updatedWatchlist = {
        ...selectedWatchlist,
        symbols: [...selectedWatchlist.symbols, symbol],
        updatedAt: new Date().toISOString()
      };
      
      setWatchlists(watchlists.map(w => w.id === selectedWatchlist.id ? updatedWatchlist as unknown as WatchlistType : w));
      setSelectedWatchlist(updatedWatchlist as unknown as WatchlistType);
      
      // Subscribe to the new symbol
      if (webSocketService.isConnected()) {
        webSocketService.subscribe({
          topic: 'quote',
          symbol,
          exchange: 'NSE'
        });
      }
      
      // Close the modal
      setIsAddSymbolModalOpen(false);
      setSearchTerm('');
      setSearchResults([]);
    } catch (err: any) {
      setError('Failed to add symbol to watchlist: ' + err.message);
    }
  };

  // Remove symbol from watchlist
  const handleRemoveSymbol = async (symbol: string) => {
    if (!selectedWatchlist) return;

    try {
      // In a real implementation, uncomment this:
      // const response = await tradingApiService.updateWatchlist(selectedWatchlist.id, {
      //   symbols: selectedWatchlist.symbols.filter(s => s !== symbol)
      // });
      
      // if (response.success) {
      //   setWatchlists(watchlists.map(w => w.id === selectedWatchlist.id ? response.data : w));
      //   setSelectedWatchlist(response.data);
      //   
      //   // Unsubscribe from the removed symbol
      //   if (webSocketService.isConnected()) {
      //     webSocketService.unsubscribe({
      //       topic: 'quote',
      //       symbol,
      //       exchange: 'NSE'
      //     });
      //   }
      // } else {
      //   setError(response.error || 'Failed to remove symbol from watchlist');
      // }
      
      // Using mock data for now
      const updatedWatchlist = {
        ...selectedWatchlist,
        symbols: selectedWatchlist.symbols.filter(s => s !== symbol),
        updatedAt: new Date().toISOString()
      };
      
      setWatchlists(watchlists.map(w => w.id === selectedWatchlist.id ? updatedWatchlist as unknown as WatchlistType : w));
      setSelectedWatchlist(updatedWatchlist as unknown as WatchlistType);
      
      // Unsubscribe from the removed symbol
      if (webSocketService.isConnected()) {
        webSocketService.unsubscribe({
          topic: 'quote',
          symbol,
          exchange: 'NSE'
        });
      }
    } catch (err: any) {
      setError('Failed to remove symbol from watchlist: ' + err.message);
    }
  };

  // Handle search for symbols
  const handleSearch = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const term = e.target.value;
    setSearchTerm(term);
    
    if (term.length < 2) {
      setSearchResults([]);
      return;
    }
    
    setIsSearching(true);
    
    // In a real implementation, this would be an API call
    // For now, we'll filter our mock data
    const results = Object.keys(mockStocksData)
      .filter(symbol => 
        symbol.toLowerCase().includes(term.toLowerCase()) || 
        mockStocksData[symbol].name.toLowerCase().includes(term.toLowerCase())
      )
      .map(symbol => ({
        symbol,
        name: mockStocksData[symbol].name
      }));
    
    setSearchResults(results);
    setIsSearching(false);
  };

  // Get the stock data for the current watchlist
  const getWatchlistStocks = () => {
    if (!selectedWatchlist) return [];
    
    return selectedWatchlist.symbols.map(symbol => ({
      symbol,
      ...stocksData[symbol]
    })).filter(stock => stock.name); // Filter out any stocks without data
  };

  // Start editing watchlist
  const startEditingWatchlist = () => {
    if (selectedWatchlist) {
      setNewWatchlistName(selectedWatchlist.name);
      setIsEditingWatchlist(true);
    }
  };

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Watchlists</h1>
        <button 
          className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700 flex items-center"
          onClick={() => {
            setIsAddingWatchlist(true);
            setNewWatchlistName('');
          }}
        >
          <Plus className="h-4 w-4 mr-2" />
          New Watchlist
        </button>
      </div>

      {error && (
        <div className="mb-4 bg-red-50 text-red-700 p-3 rounded-md flex items-center">
          <AlertCircle className="h-5 w-5 mr-2" />
          <span>{error}</span>
          <button 
            className="ml-auto text-red-500 hover:text-red-700"
            onClick={() => setError(null)}
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Watchlist Sidebar */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 h-[calc(100vh-12rem)] flex flex-col">
          <div className="p-4 border-b border-gray-200 font-medium">
            My Watchlists
          </div>
          
          {isAddingWatchlist ? (
            <div className="p-4 border-b border-gray-200">
              <input 
                type="text"
                placeholder="Watchlist name"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                value={newWatchlistName}
                onChange={(e) => setNewWatchlistName(e.target.value)}
                autoFocus
              />
              <div className="flex justify-end mt-2 space-x-2">
                <button 
                  className="px-3 py-1 border border-gray-300 rounded text-gray-700 text-sm hover:bg-gray-50"
                  onClick={() => setIsAddingWatchlist(false)}
                >
                  Cancel
                </button>
                <button 
                  className="px-3 py-1 bg-indigo-600 text-white rounded text-sm hover:bg-indigo-700"
                  onClick={handleCreateWatchlist}
                >
                  Create
                </button>
              </div>
            </div>
          ) : null}
          
          <div className="overflow-y-auto flex-1">
            {watchlists.map(watchlist => (
              <div 
                key={watchlist.id}
                className={`p-4 border-b border-gray-200 flex justify-between items-center hover:bg-gray-50 cursor-pointer ${
                  selectedWatchlist?.id === watchlist.id ? 'bg-indigo-50' : ''
                }`}
                onClick={() => handleSelectWatchlist(watchlist)}
              >
                <div className="flex items-center">
                  {watchlist.isDefault && (
                    <Star className="h-4 w-4 text-yellow-400 mr-2" />
                  )}
                  <span>{watchlist.name}</span>
                  <span className="text-xs text-gray-500 ml-2">({watchlist.symbols.length})</span>
                </div>
                
                {selectedWatchlist?.id === watchlist.id && !watchlist.isDefault && (
                  <div className="flex items-center">
                    <button 
                      className="text-gray-400 hover:text-gray-600 p-1"
                      onClick={(e) => {
                        e.stopPropagation();
                        startEditingWatchlist();
                      }}
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button 
                      className="text-gray-400 hover:text-red-600 p-1"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteWatchlist(watchlist.id);
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Watchlist Content */}
        <div className="lg:col-span-3">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 h-[calc(100vh-12rem)] flex flex-col">
            {/* Watchlist Header */}
            <div className="p-4 border-b border-gray-200 flex justify-between items-center">
              {isEditingWatchlist ? (
                <div className="flex-1 flex items-center">
                  <input 
                    type="text"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    value={newWatchlistName}
                    onChange={(e) => setNewWatchlistName(e.target.value)}
                    autoFocus
                  />
                  <button 
                    className="ml-2 p-2 text-gray-400 hover:text-gray-600"
                    onClick={() => setIsEditingWatchlist(false)}
                  >
                    <X className="h-4 w-4" />
                  </button>
                  <button 
                    className="ml-1 p-2 text-green-500 hover:text-green-600"
                    onClick={handleUpdateWatchlist}
                  >
                    <Save className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <h2 className="text-lg font-semibold">
                  {selectedWatchlist?.name || 'Select a Watchlist'}
                </h2>
              )}
              
              <div className="flex items-center space-x-2">
                <button className="p-1 text-gray-500 hover:text-gray-700" onClick={() => fetchWatchlists()}>
                  <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                </button>
                <button 
                  className="p-1 text-gray-500 hover:text-gray-700"
                  onClick={() => setIsAddSymbolModalOpen(true)}
                >
                  <Plus className="h-4 w-4" />
                </button>
                <div className="relative">
                  <button className="p-1 text-gray-500 hover:text-gray-700">
                    <MoreHorizontal className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
            
            {/* Watchlist Content */}
            {selectedWatchlist ? (
              selectedWatchlist.symbols.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-gray-500">
                  <p className="mb-2">This watchlist is empty</p>
                  <button
                    className="text-indigo-600 hover:text-indigo-700 flex items-center"
                    onClick={() => setIsAddSymbolModalOpen(true)}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add symbols
                  </button>
                </div>
              ) : (
                <div className="overflow-x-auto flex-1">
                  <table className="w-full">
                    <thead>
                      <tr className="text-xs font-medium text-gray-500 bg-gray-50 border-b border-gray-200">
                        <th className="py-3 px-4 text-left">Symbol</th>
                        <th className="py-3 px-4 text-left">LTP</th>
                        <th className="py-3 px-4 text-left">Change</th>
                        <th className="py-3 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {getWatchlistStocks().map((stock) => (
                        <tr key={stock.symbol} className="border-b border-gray-200 hover:bg-gray-50">
                          <td className="py-3 px-4">
                            <div>
                              <p className="font-medium">{stock.symbol}</p>
                              <p className="text-xs text-gray-500">{stock.name}</p>
                            </div>
                          </td>
                          <td className="py-3 px-4 font-medium">{stock.ltp}</td>
                          <td className={`py-3 px-4 ${stock.trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
                            <div className="flex items-center">
                              {stock.trend === 'up' ? <ArrowUp className="h-3 w-3 mr-1" /> : <ArrowDown className="h-3 w-3 mr-1" />}
                              <span>{stock.change} ({stock.changePercent})</span>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <div className="flex justify-end items-center space-x-2">
                              <Link 
                                href={`/dashboard/stock/${stock.symbol}`}
                                className="text-gray-400 hover:text-indigo-600 p-1"
                              >
                                <ArrowRightCircle className="h-4 w-4" />
                              </Link>
                              <button 
                                className="text-gray-400 hover:text-red-600 p-1"
                                onClick={() => handleRemoveSymbol(stock.symbol)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )
            ) : (
              <div className="flex-1 flex items-center justify-center text-gray-500">
                Select a watchlist to view stocks
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add Symbol Modal */}
      {isAddSymbolModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="add-symbol-modal" role="dialog" aria-modal="true">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true" onClick={() => setIsAddSymbolModalOpen(false)}></div>

            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                    <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4" id="modal-title">
                      Add Symbol to Watchlist
                    </h3>
                    
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Search className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type="text"
                        className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                        placeholder="Search for a symbol..."
                        value={searchTerm}
                        onChange={handleSearch}
                        autoFocus
                      />
                    </div>

                    <div className="mt-4 max-h-60 overflow-y-auto">
                      {isSearching ? (
                        <div className="py-4 text-center text-gray-500">
                          Searching...
                        </div>
                      ) : searchResults.length === 0 ? (
                        searchTerm.length < 2 ? (
                          <div className="py-4 text-center text-gray-500">
                            Type at least 2 characters to search
                          </div>
                        ) : (
                          <div className="py-4 text-center text-gray-500">
                            No results found for "{searchTerm}"
                          </div>
                        )
                      ) : (
                        <ul className="divide-y divide-gray-200">
                          {searchResults.map(result => (
                            <li 
                              key={result.symbol}
                              className="py-3 px-2 hover:bg-gray-50 cursor-pointer flex justify-between items-center"
                              onClick={() => handleAddSymbol(result.symbol)}
                            >
                              <div>
                                <p className="font-medium">{result.symbol}</p>
                                <p className="text-sm text-gray-500">{result.name}</p>
                              </div>
                              <div className="text-indigo-600">
                                <Plus className="h-5 w-5" />
                              </div>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                  onClick={() => setIsAddSymbolModalOpen(false)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}'use client';

import React, { useState, useEffect } from 'react';
import { 
  ArrowDown, 
  ArrowUp, 
  ChevronDown, 
  Edit2, 
  Plus, 
  RefreshCw,
