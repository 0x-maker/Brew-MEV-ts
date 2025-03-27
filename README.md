# 🚀 Brew-MEV: Solana MEV Trading Bot

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Solana](https://img.shields.io/badge/Solana-20232A?logo=solana)](https://solana.com/)
[![Next.js](https://img.shields.io/badge/Next.js-000000?logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)

**Brew-MEV** is an open-source MEV (Maximal Extractable Value) trading bot built for the Solana blockchain. It provides both a CLI interface and a modern web dashboard to monitor and control your trading strategies.

![MEVSS Image](https://storage.verity.dev/storage/mevss.png)


## 📋 Table of Contents

- [Overview](#-overview)
- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Project Status](#-project-status)
- [Getting Started](#-getting-started)
- [Usage](#-usage)
- [Security](#-security)
- [Roadmap](#-roadmap)
- [Contributing](#-contributing)
- [License](#-license)

## 🌟 Overview

Brew-MEV is designed to help traders capitalize on MEV opportunities in the Solana ecosystem. The bot monitors transactions and market conditions to identify profitable arbitrage opportunities, frontrunning possibilities, and other MEV strategies.

The project includes:
- 🖥️ CLI interface for terminal-based control
- 🌐 Modern web dashboard for visual monitoring and management
- 🔒 Secure wallet management with encrypted private keys
- ⚙️ Customizable trading parameters
- 📊 Multi-DEX integration (Raydium, Jupiter)

## ✨ Features

### 🟢 Functional Features

- **Secure Wallet Management**
  - Create and import Solana wallets
  - Private keys are encrypted in storage
  - QR code generation for deposits

- **Dashboard Interface**
  - Modern UI with dark/light mode
  - Real-time wallet balance display
  - Bot status monitoring

- **CLI Interface**
  - Interactive command-line interface
  - Full wallet management
  - Strategy configuration

- **Trading Settings**
  - Market cap filtering
  - Stop-loss and take-profit settings
  - Automated buy parameters
  - DEX selection (Pump.FUN, Raydium, Jupiter)

- **Security**
  - AES-256 encryption for private keys
  - Environment-specific encryption key generation
  - Automatic migration from plaintext to encrypted format

### 🟡 Work in Progress

- **Trading Algorithms**
  - Arbitrage opportunity detection
  - Sandwich attack protection
  - Token scanning is currently simulated

- **Performance Monitoring**
  - Historical transaction data
  - Profit/loss tracking
  - Performance analytics

- **DEX Integration**
  - Complete integration with Jupiter API
  - Raydium real-time data fetching

### 🔮 Planned Future Features

- **Advanced Strategies**
  - Machine learning for strategy optimization
  - Historical data analysis
  - Strategy backtesting

- **Risk Management**
  - Advanced stop-loss mechanisms
  - Portfolio diversification
  - Capital allocation optimization

- **Liquidity Pool Monitoring**
  - LP position optimization
  - Impermanent loss protection

- **Community Features**
  - Strategy sharing marketplace
  - Community performance leaderboards
  - Customizable strategy templates

## 🔧 Tech Stack

### Frontend
- **Next.js 14** - React framework with SSR and app router
- **TypeScript** - Type-safe JavaScript
- **TailwindCSS** - Utility-first CSS framework
- **Shadcn/ui** - Reusable and accessible UI components
- **Lucide Icons** - Beautiful SVG icons

### Backend
- **Node.js** - JavaScript runtime
- **Next.js API Routes** - Serverless API endpoints
- **Solana Web3.js** - Solana blockchain interaction

### Security
- **Crypto-js** - Client-side encryption
- **AES-256** - Advanced Encryption Standard

### CLI
- **Inquirer** - Interactive command-line user interfaces
- **Chalk** - Terminal styling
- **Figlet** - ASCII art text generation

## 🚦 Project Status

Brew-MEV is currently in **alpha stage** development. The core infrastructure, UI, and wallet management are functional, but the actual MEV strategies and trading algorithms are still being developed and tested.

| Component | Status | Description |
|-----------|--------|-------------|
| Web Dashboard | ✅ | Fully functional with modern UI |
| Wallet Management | ✅ | Complete with encryption |
| CLI Interface | ✅ | Fully operational |
| Settings Management | ✅ | Complete with persistence |
| Trading Algorithms | 🟡 | Under active development |
| DEX Integration | 🟡 | Partially implemented |
| Performance Analytics | 🟡 | Basic implementation, needs enhancement |
| Risk Management | 🔴 | Planned for future releases |

## 🚀 Getting Started

### Prerequisites

- Node.js 16+ and npm
- Basic understanding of Solana blockchain
- (Optional) Solana CLI tools

### Installation

1. Clone the repository
   ```bash
   git clone https://github.com/yourusername/brew-mev.git
   cd brew-mev
   ```

2. Install dependencies
   ```bash
   npm install
   ```

3. Run the development server
   ```bash
   npm run dev
   ```

4. For CLI interface
   ```bash
   npm run cli
   ```

## 🧰 Usage

### Web Dashboard

1. Open your browser to http://localhost:3000
2. Create a new wallet or import an existing one
3. Configure your trading settings
4. Start the bot and monitor performance

### CLI Interface

The CLI provides an interactive interface with the following options:

- View wallet information
- Generate deposit QR code
- Check balance
- Start/stop the bot
- Configure settings
- Create/import wallets

Example:
```bash
npm run cli
```

## 🔒 Security

Brew-MEV takes security seriously, especially when handling private keys:

- Private keys are encrypted using AES-256 before storage
- Encryption keys are derived from a combination of factors unique to the user's environment
- Keys are only decrypted in memory when needed for transactions
- No plaintext keys are stored or displayed in the UI

**⚠️ Important:** Always verify transaction details before confirming. This is alpha software, use at your own risk.

## 👥 Contributing

We love contributions! Brew-MEV is an open-source project and welcomes developers of all skill levels.

1. Fork the project
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

See [CONTRIBUTING.md](CONTRIBUTING.md) for more information.

## ❤️ Why We Love Solana

We're building on Solana because:
- 🚀 Incredible transaction speed and throughput
- 💰 Low transaction fees
- 🌱 Growing ecosystem of projects and developers
- 🔧 Robust developer tools and documentation


## 📜 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## ⚠️ Important:** Always verify transaction details before confirming. This is alpha software, use at your own risk.


---

Built with ❤️ for the Solana community.
