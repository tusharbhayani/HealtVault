# HealthGuardian 🏥⛓️

**Blockchain-Secured Emergency Medical Information System**

HealthGuardian is a revolutionary mobile application that securely stores and manages emergency medical information using Algorand blockchain technology. The app provides instant access to critical health data during emergencies through QR codes while maintaining the highest standards of data security and privacy.

<td style="background:#222; text-align:center;"><img src="assets/images/bolt.png" width="250px"></td>
<td style="background:#222; text-align:center;"><img src="assets/images/algorand.png" width="250px"></td>
<td style="background:#222; text-align:center;"><img src="assets/images/elevenLabs.png" width="250px"></td>
<td style="background:#222; text-align:center;"><img src="assets/images/supabase.png" width="250px"></td>

## 🌟 Key Features

### 🔐 Blockchain Security
- **Algorand Integration**: All health data is cryptographically secured on the Algorand blockchain
- **Data Integrity**: Immutable records ensure your medical information cannot be tampered with
- **Verification**: Real-time blockchain verification of document authenticity
- **Transparency**: View your transactions on the Algorand blockchain explorer

### 🚨 Emergency Access
- **QR Code Generation**: Instant QR codes for emergency responder access
- **Offline Capability**: Critical information accessible without internet connection
- **Multi-format Export**: Download as PNG, PDF, or text files
- **Voice Readout**: Text-to-speech for hands-free emergency information

### 🎤 AI Voice Assistant (Premium)
- **Natural Language**: Ask questions about your health data using voice commands
- **Multi-language Support**: English, Spanish, and French voice interaction
- **ElevenLabs Integration**: High-quality AI voice responses
- **Emergency Commands**: Quick access to critical information

### 📄 Document Verification (Premium)
- **Blockchain Verification**: Verify document authenticity against blockchain records
- **Tamper Detection**: Identify modified or fraudulent documents
- **Batch Processing**: Verify multiple documents simultaneously
- **Audit Trail**: Complete verification history and logs

### 🔒 Privacy & Security
- **HIPAA Compliance**: Meets healthcare data protection standards
- **End-to-End Encryption**: Data encrypted at rest and in transit
- **Zero-Knowledge Architecture**: Only you control your medical data
- **Audit Logging**: Complete access logs for compliance

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm
- Expo CLI (`npm install -g @expo/cli`)
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/healthguardian.git
   cd healthguardian
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Configure the following variables in `.env`:
   ```env
   EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
   EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   EXPO_PUBLIC_ELEVENLABS_API_KEY=your_elevenlabs_api_key
   EXPO_PUBLIC_ELEVENLABS_VOICE_ID=your_voice_id
   ```

4. **Set up Supabase database**
   ```bash
   # Run the provided SQL migrations in your Supabase dashboard
   # Files: supabase/migrations/*.sql
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```

### Mobile (iOS/Android)
- **React Native**: Native performance and features
- **Expo Managed Workflow**: Easy deployment and updates
- **Camera Integration**: Native QR code scanning
- **Secure Storage**: Platform-specific encryption

## 🏗️ Architecture

### Frontend Stack
- **React Native**: Cross-platform mobile development
- **Expo Router**: File-based navigation system
- **TypeScript**: Type-safe development
- **Zustand**: Lightweight state management
- **Lucide Icons**: Consistent iconography

### Backend Services
- **Supabase**: Database, authentication, and real-time features
- **Algorand Blockchain**: Immutable data storage and verification
- **ElevenLabs**: AI voice synthesis and processing
- **IPFS**: Decentralized document storage (optional)

### Security Layer
- **AES-256 Encryption**: Data encryption at rest
- **PBKDF2 Key Derivation**: Secure key generation
- **Row Level Security**: Database-level access control
- **Blockchain Verification**: Cryptographic data integrity

## 📊 Database Schema

### Core Tables

#### `profiles`
- User account information and subscription status
- Links to Supabase Auth users

#### `health_records`
- Encrypted medical information
- Blockchain transaction references
- QR code identifiers

#### `health_documents`
- Document metadata and verification status
- IPFS hashes for decentralized storage

#### `premium_features`
- Feature definitions and access control
- Subscription management

## 🔧 Development

### Available Scripts

```bash
# Development
npm run dev                    # Start development server
npm run build:web             # Build for web deployment

# Testing
npm run test                   # Run test suite
npm run test:watch            # Run tests in watch mode

# Algorand Blockchain
npm run test-algorand         # Test blockchain integration
npm run fund-account          # Fund test account with ALGOs
npm run check-network         # Verify Algorand network status
npm run debug-account         # Debug account issues
npm run clear-regenerate      # Reset and regenerate account

# Linting
npm run lint                  # Run ESLint
```

### Project Structure

```
healthguardian/
├── app/                      # Expo Router pages
│   ├── (auth)/              # Authentication screens
│   ├── (tabs)/              # Main app tabs
│   └── emergency/           # Emergency access screens
├── components/              # Reusable UI components
│   ├── ui/                  # Base UI components
│   └── ...                  # Feature-specific components
├── lib/                     # Core libraries and utilities
│   ├── blockchain/          # Algorand integration
│   ├── security/            # HIPAA compliance and encryption
│   ├── storage/             # Data persistence
│   └── ...                  # Other utilities
├── store/                   # Zustand state management
├── supabase/               # Database migrations
└── scripts/                # Development and deployment scripts
```

### Code Style

- **TypeScript**: Strict type checking enabled
- **ESLint**: Airbnb configuration with React Native rules
- **Prettier**: Consistent code formatting
- **Conventional Commits**: Standardized commit messages

## 🧪 Testing

### Test Coverage

- **Unit Tests**: Core business logic and utilities
- **Integration Tests**: API and blockchain interactions
- **Component Tests**: React Native component behavior
- **E2E Tests**: Critical user flows

### Running Tests

```bash
# Run all tests
npm test

# Run specific test suites
npm test -- auth.test.ts
npm test -- health.test.ts
npm test -- algorand.test.ts

# Generate coverage report
npm test -- --coverage
```

## 🚀 Deployment

### Web Deployment

1. **Build the application**
   ```bash
   npm run build:web
   ```

2. **Deploy to hosting platform**
   - Vercel, Netlify, or similar
   - Configure environment variables
   - Set up custom domain

### Mobile Deployment

1. **Create development build**
   ```bash
   expo build:ios
   expo build:android
   ```

2. **Submit to app stores**
   ```bash
   expo submit:ios
   expo submit:android
   ```

### Environment Configuration

#### Development
```env
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

#### Production
```env
EXPO_PUBLIC_SUPABASE_URL=https://your-prod-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_prod_anon_key
EXPO_PUBLIC_ELEVENLABS_API_KEY=your_production_api_key
```

## 🔐 Security Considerations

### Data Protection
- **Encryption**: All sensitive data encrypted with AES-256
- **Key Management**: Secure key derivation and storage
- **Access Control**: Role-based permissions and RLS
- **Audit Logging**: Complete access and modification logs

### Blockchain Security
- **Immutable Records**: Data cannot be altered once stored
- **Cryptographic Verification**: Hash-based integrity checking
- **Decentralized Storage**: No single point of failure
- **Transparent Verification**: Public blockchain verification

### Privacy Compliance
- **HIPAA Compliance**: Healthcare data protection standards
- **GDPR Ready**: European privacy regulation compliance
- **Data Minimization**: Only necessary data collection
- **User Control**: Complete data ownership and control

## 📈 Performance

### Optimization Strategies
- **Code Splitting**: Lazy loading of non-critical features
- **Image Optimization**: Compressed and responsive images
- **Caching**: Intelligent data and asset caching
- **Bundle Analysis**: Regular bundle size monitoring

### Monitoring
- **Error Tracking**: Comprehensive error reporting
- **Performance Metrics**: Real-time performance monitoring
- **User Analytics**: Privacy-respecting usage analytics
- **Blockchain Monitoring**: Transaction status tracking

## 🤝 Contributing

We welcome contributions to HealthGuardian! Please follow these guidelines:

### Development Process

1. **Fork the repository**
2. **Create a feature branch**
   ```bash
   git checkout -b feature/amazing-feature
   ```
3. **Make your changes**
4. **Add tests** for new functionality
5. **Run the test suite**
   ```bash
   npm test
   ```
6. **Commit your changes**
   ```bash
   git commit -m "feat: add amazing feature"
   ```
7. **Push to your branch**
   ```bash
   git push origin feature/amazing-feature
   ```
8. **Open a Pull Request**

### Code Standards

- Follow TypeScript best practices
- Maintain test coverage above 80%
- Use conventional commit messages
- Update documentation for new features
- Ensure mobile and web compatibility

### Issue Reporting

When reporting issues, please include:
- Device/browser information
- Steps to reproduce
- Expected vs actual behavior
- Screenshots or error logs
- Blockchain transaction IDs (if applicable)

## 📚 Documentation

### User Guides
- [Getting Started Guide](docs/getting-started.md)
- [Emergency QR Code Setup](docs/qr-code-setup.md)
- [Voice Assistant Usage](docs/voice-assistant.md)
- [Document Verification](docs/document-verification.md)

### Developer Documentation
- [API Reference](docs/api-reference.md)
- [Blockchain Integration](docs/blockchain-integration.md)
- [Security Architecture](docs/security-architecture.md)
- [Deployment Guide](docs/deployment.md)

### Video Tutorials
- [App Overview](https://youtube.com/watch?v=demo)
- [Setting Up Emergency Data](https://youtube.com/watch?v=demo)
- [Using Voice Commands](https://youtube.com/watch?v=demo)
- [Verifying Documents](https://youtube.com/watch?v=demo)

## 🆘 Support

### Getting Help

- **Documentation**: Check our comprehensive docs
- **GitHub Issues**: Report bugs and request features
- **Community Forum**: Join discussions with other users
- **Email Support**: support@healthguardian.app

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

### Technology Partners
- **Algorand Foundation**: Blockchain infrastructure
- **Supabase**: Backend-as-a-Service platform
- **ElevenLabs**: AI voice technology
- **Expo**: React Native development platform

### Open Source Libraries
- React Native and Expo ecosystem
- Zustand for state management
- Lucide for iconography
- React Native QR Code SVG

### Medical Advisory Board
- Dr. Sarah Johnson, Emergency Medicine
- Dr. Michael Chen, Digital Health
- Dr. Emily Rodriguez, Medical Informatics

## 🌍 Global Impact

HealthGuardian is making healthcare more accessible and secure worldwide:

- **Emergency Response**: Faster access to critical medical information
- **Data Security**: Blockchain-level protection for sensitive health data
- **Healthcare Equity**: Equal access to emergency medical information
- **Innovation**: Advancing the intersection of healthcare and blockchain technology

---

**Built with ❤️ for global health and safety**

*HealthGuardian - Your Health, Secured by Blockchain*

For more information, visit [healthguardian.app](https://healthguardian.app)