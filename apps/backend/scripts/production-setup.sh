
set -e  # Exit on error

echo "🚀 SBTS Backend - Production Setup"
echo "======================================"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Step 1: Check if .env.production exists
echo "📋 Step 1: Checking environment file..."
if [ ! -f .env.production ]; then
    echo -e "${RED}❌ .env.production not found!${NC}"
    echo ""
    echo "Creating from example..."
    cp .env.production.example .env.production
    echo -e "${YELLOW}⚠️  Please edit .env.production with your actual values${NC}"
    echo "   Then run this script again"
    exit 1
else
    echo -e "${GREEN}✅ .env.production found${NC}"
fi

# Step 2: Generate secrets
echo ""
echo "🔐 Step 2: Generating secrets..."
node scripts/generate-secrets.js
echo ""
echo -e "${YELLOW}⚠️  Copy the secrets above to your .env.production file${NC}"
read -p "Press enter when done..."

# Step 3: Install dependencies
echo ""
echo "📦 Step 3: Installing dependencies..."
npm ci --production=false

# Step 4: Build application
echo ""
echo "🔨 Step 4: Building application..."
npm run build

# Step 5: Database setup
echo ""
echo "🗄️  Step 5: Setting up database..."
echo ""
echo "Choose database setup method:"
echo "1) Run migrations (Recommended)"
echo "2) Push schema (Development only)"
echo "3) Skip database setup"
read -p "Enter choice [1-3]: " db_choice

case $db_choice in
    1)
        echo "Running migrations..."
        npx prisma migrate deploy
        npx prisma generate
        echo -e "${GREEN}✅ Migrations applied${NC}"
        ;;
    2)
        echo "Pushing schema..."
        npx prisma db push
        npx prisma generate
        echo -e "${GREEN}✅ Schema pushed${NC}"
        ;;
    3)
        echo -e "${YELLOW}⚠️  Skipping database setup${NC}"
        ;;
    *)
        echo -e "${RED}Invalid choice${NC}"
        exit 1
        ;;
esac

# Step 6: Create logs directory
echo ""
echo "📝 Step 6: Creating logs directory..."
mkdir -p logs
echo -e "${GREEN}✅ Logs directory created${NC}"

# Step 7: Summary
echo ""
echo "======================================"
echo -e "${GREEN}✅ Production setup complete!${NC}"
echo "======================================"
echo ""
echo "Next steps:"
echo "1. Start the application:"
echo "   pm2 start ecosystem.config.js --env production"
echo ""
echo "2. Monitor the application:"
echo "   pm2 monit"
echo ""
echo "3. View logs:"
echo "   pm2 logs sbts-backend"
echo ""
echo "4. Test the deployment:"
echo "   curl http://localhost:4000/health"
echo ""
echo "======================================"
