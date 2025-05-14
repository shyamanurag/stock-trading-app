package models

import (
	"time"
)

// MarketStatus represents the status of the market
type MarketStatus string

const (
	MarketStatusPreOpen    MarketStatus = "PRE_OPEN"
	MarketStatusOpen       MarketStatus = "OPEN"
	MarketStatusClosed     MarketStatus = "CLOSED"
	MarketStatusPostClose  MarketStatus = "POST_CLOSE"
	MarketStatusHoliday    MarketStatus = "HOLIDAY"
)

// Symbol represents a tradable symbol/instrument
type Symbol struct {
	Symbol            string  `json:"symbol"`
	Name              string  `json:"name"`
	Exchange          string  `json:"exchange"`
	InstrumentType    string  `json:"instrumentType"`
	Segment           string  `json:"segment"`
	Series            string  `json:"series"`
	ISIN              string  `json:"isin"`
	TickSize          float64 `json:"tickSize"`
	LotSize           int     `json:"lotSize"`
	PricePrecision    int     `json:"pricePrecision"`
	TradingPermitted  bool    `json:"tradingPermitted"`
	ExpiryDate        *time.Time `json:"expiryDate,omitempty"`
	StrikePrice       *float64 `json:"strikePrice,omitempty"`
	OptionType        *string `json:"optionType,omitempty"`
	UnderlyingSymbol  string  `json:"underlyingSymbol,omitempty"`
	MarketLot         int     `json:"marketLot"`
	FreezeQty         int     `json:"freezeQty"`
	MaxOrderSize      int     `json:"maxOrderSize"`
	LastUpdateTime    time.Time `json:"lastUpdateTime"`
}

// MarketQuote represents a market quote for a symbol
type MarketQuote struct {
	Symbol           string     `json:"symbol"`
	Exchange         string     `json:"exchange"`
	LastPrice        float64    `json:"lastPrice"`
	Open             float64    `json:"open"`
	High             float64    `json:"high"`
	Low              float64    `json:"low"`
	Close            float64    `json:"close"` // Previous day close
	Change           float64    `json:"change"`
	ChangePercent    float64    `json:"changePercent"`
	Volume           int64      `json:"volume"`
	AveragePrice     float64    `json:"averagePrice"`
	TotalBuyQty      int64      `json:"totalBuyQty"`
	TotalSellQty     int64      `json:"totalSellQty"`
	Bid              float64    `json:"bid"`
	BidQty           int        `json:"bidQty"`
	Ask              float64    `json:"ask"`
	AskQty           int        `json:"askQty"`
	OpenInterest     int64      `json:"openInterest,omitempty"`
	PreviousOI       int64      `json:"previousOI,omitempty"`
	LowerCircuit     float64    `json:"lowerCircuit"`
	UpperCircuit     float64    `json:"upperCircuit"`
	YearHigh         float64    `json:"yearHigh"`
	YearLow          float64    `json:"yearLow"`
	LastTradeTime    time.Time  `json:"lastTradeTime"`
	LastUpdateTime   time.Time  `json:"lastUpdateTime"`
	MarketStatus     MarketStatus `json:"marketStatus"`
}

// MarketDepth represents the market depth for a symbol
type MarketDepth struct {
	Symbol         string        `json:"symbol"`
	Exchange       string        `json:"exchange"`
	Bids           []DepthLevel  `json:"bids"`
	Asks           []DepthLevel  `json:"asks"`
	LastUpdateTime time.Time     `json:"lastUpdateTime"`
}

// DepthLevel represents a level in the market depth
type DepthLevel struct {
	Price    float64 `json:"price"`
	Quantity int     `json:"quantity"`
	Orders   int     `json:"orders"`
}

// OHLC represents an OHLC candlestick
type OHLC struct {
	Timestamp time.Time `json:"timestamp"`
	Open      float64   `json:"open"`
	High      float64   `json:"high"`
	Low       float64   `json:"low"`
	Close     float64   `json:"close"`
	Volume    int64     `json:"volume"`
}

// HistoricalData represents historical OHLC data
type HistoricalData struct {
	Symbol     string       `json:"symbol"`
	Exchange   string       `json:"exchange"`
	Interval   string       `json:"interval"`
	StartTime  time.Time    `json:"startTime"`
	EndTime    time.Time    `json:"endTime"`
	Candles    []OHLC       `json:"candles"`
}

// MarketIndex represents a market index
type MarketIndex struct {
	Symbol        string      `json:"symbol"`
	Name          string      `json:"name"`
	LastPrice     float64     `json:"lastPrice"`
	Open          float64     `json:"open"`
	High          float64     `json:"high"`
	Low           float64     `json:"low"`
	Close         float64     `json:"close"` // Previous day close
	Change        float64     `json:"change"`
	ChangePercent float64     `json:"changePercent"`
	LastUpdateTime time.Time  `json:"lastUpdateTime"`
}

// GetQuoteRequest represents a request to get a market quote
type GetQuoteRequest struct {
	Symbol   string `json:"symbol" binding:"required"`
	Exchange string `json:"exchange" binding:"required"`
}

// GetHistoricalDataRequest represents a request to get historical data
type GetHistoricalDataRequest struct {
	Symbol    string    `json:"symbol" binding:"required"`
	Exchange  string    `json:"exchange" binding:"required"`
	Interval  string    `json:"interval" binding:"required"`
	StartTime time.Time `json:"startTime" binding:"required"`
	EndTime   time.Time `json:"endTime" binding:"required"`
}

// MarketEvent represents a market event
type MarketEvent struct {
	EventType  string     `json:"eventType"`
	Symbol     string     `json:"symbol"`
	Exchange   string     `json:"exchange"`
	EventTime  time.Time  `json:"eventTime"`
	Data       JSON       `json:"data"`
}

// TickerSubscription represents a user's subscription to a market ticker
type TickerSubscription struct {
	UserID   string   `json:"userId"`
	Symbols  []string `json:"symbols"`
	Exchange string   `json:"exchange"`
}

// MarketHoliday represents a market holiday
type MarketHoliday struct {
	Date        time.Time `json:"date"`
	Description string    `json:"description"`
	Exchange    string    `json:"exchange"`
	Status      string    `json:"status"` // CLOSED, EARLY_CLOSE
	CloseTime   *string   `json:"closeTime,omitempty"`
}
