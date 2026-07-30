import { lazy } from 'react';
const DashboardRouter = lazy(() => import('../pages/DashboardRouter'));
const Shop = lazy(() => import('../pages/Shops/Shop'));
const ShopView = lazy(() => import('../pages/Shops/ShopView'));
const AdminShopCustomers = lazy(() => import('../pages/Shops/AdminShopCustomers'));
const AdminShopFinance = lazy(() => import('../pages/Shops/AdminShopFinance'));
const AdminShopExpenses = lazy(() => import('../pages/Shops/AdminShopExpenses'));
const Analytics = lazy(() => import('../pages/Analytics'));
const Finance = lazy(() => import('../pages/Finance'));
const Crypto = lazy(() => import('../pages/Crypto'));
const Todolist = lazy(() => import('../pages/Apps/Todolist'));
const Mailbox = lazy(() => import('../pages/Apps/Mailbox'));
const Notes = lazy(() => import('../pages/Apps/Notes'));
const Contacts = lazy(() => import('../pages/Apps/Contacts'));
// shop owner
const CreateUserShopOwner = lazy(() => import('../pages/Users/CreateUserShopOwner'));
const UserShopOwner = lazy(() => import('../pages/Users/UserShopOwner'));
const EditShopOwner = lazy(() => import('../pages/Users/EditShopOwner'));
// Subcriptions
const ViewAllSubcriptions = lazy(() => import('../pages/Subcriptions/ViewAllSubcriptions'));
const EditSubcription = lazy(() => import('../pages/Subcriptions/EditSubcription'));
const AddNewSubcription = lazy(() => import('../pages/Subcriptions/AddNewSubcription'));
const SubcriptionHistory = lazy(() => import('./../pages/Subcriptions/SubcriptionHistory'));
const ViewHistoryspecifc = lazy(() => import('./../pages/Subcriptions/ViewHistoryspecifc'));
// crops
const ViewAllCrops = lazy(() => import('./../pages/Crops/ViewAllCrops'));
const GetAssginShopCrops = lazy(() => import('./../pages/Crops/GetAssginShopCrops'));
const CropMenuCards = lazy(() => import('./../pages/Crops/CropMenuCards'));
const CropHistory = lazy(() => import('./../pages/Crops/CropHistory'));
const CropPosRecord = lazy(() => import('./../pages/Crops/CropPosRecord'));
const BuyerList = lazy(() => import('./../pages/Crops/BuyerList'));
const MalakhtaList = lazy(() => import('./../pages/Crops/MalakhtaList'));
const AddNewCrop = lazy(() => import('./../pages/Crops/AddNewCrop'));
const EditCrop = lazy(() => import('./../pages/Crops/EditCrop'));
// Customer
const AddNewCustomer = lazy(() => import('./../pages/Customer/AddNewCustomer'));
const EditCustomer = lazy(() => import('./../pages/Customer/EditCustomer'));
const CustomerList = lazy(() => import('./../pages/Customer/CustomerList'));
const CustomerBalance = lazy(() => import('./../pages/Customer/CustomerBalance'));
// receipt & management 
const AddDanaMandiOrder = lazy(() => import('./../pages/Receipt/AddDanaMandiOrder'));
const AddVegetableOrder = lazy(() => import('./../pages/Receipt/AddVegetableOrder'));
const DanaMandiCropOrderList = lazy(() => import('./../pages/Receipt/DanaMandiCropOrderList'));
const DanaMandiCustomerList = lazy(() => import('./../pages/Receipt/DanaMandiCustomerList'));
const DanaMandiCustomerOrderList = lazy(() => import('./../pages/Receipt/DanaMandiCustomerOrderList'));
// Support (shop owner + admin/team)
const MyTickets = lazy(() => import('./../pages/Support/MyTickets'));
const SupportMailbox = lazy(() => import('./../pages/Support/SupportMailbox'));
const CreateTicket = lazy(() => import('./../pages/Support/CreateTicket'));
const TicketDetail = lazy(() => import('./../pages/Support/TicketDetail'));
// Admin – Support & Team
const SupportTicketsAll = lazy(() => import('./../pages/Admin/SupportTicketsAll'));
const TeamList = lazy(() => import('./../pages/Admin/TeamList'));
const AddTeamMember = lazy(() => import('./../pages/Admin/AddTeamMember'));
// Pesticide POS (admin)
const RegisterPesticideShop = lazy(() => import('./../pages/PesticidePos/RegisterPesticideShop'));
const PesticidePosSubscriptions = lazy(() => import('./../pages/PesticidePos/PesticidePosSubscriptions'));
const PesticideShopList = lazy(() => import('./../pages/PesticidePos/PesticideShopList'));
const PosOwnersList = lazy(() => import('./../pages/PesticidePos/PosOwnersList'));
const PosSubscriptionHistory = lazy(() => import('./../pages/PesticidePos/PosSubscriptionHistory'));
const EditPesticideShop = lazy(() => import('./../pages/PesticidePos/EditPesticideShop'));
const EditPosSubscription = lazy(() => import('./../pages/PesticidePos/EditPosSubscription'));
const PesticidePosLogin = lazy(() => import('./../pages/Authentication/PesticidePosLogin'));
// POS Shop (pesticide shop owner – layout: pos)
const PosDashboard = lazy(() => import('./../pages/Pos/PosDashboard'));
const PosSale = lazy(() => import('./../pages/Pos/PosSale'));
const PosSaleEdit = lazy(() => import('./../pages/Pos/PosSaleEdit'));
const PosProducts = lazy(() => import('./../pages/Pos/PosProducts'));
const PosSalesHistory = lazy(() => import('./../pages/Pos/PosSalesHistory'));
const PosCustomers = lazy(() => import('./../pages/Pos/PosCustomers'));
const PosReceipt = lazy(() => import('./../pages/Pos/PosReceipt'));
const CommissionShopManagement = lazy(() => import('./../pages/Pos/CommissionShopManagement'));
const PosPendingRequests = lazy(() => import('./../pages/Pos/PosPendingRequests'));
const PosProfile = lazy(() => import('./../pages/Pos/PosProfile'));
// Connections (Shop owner <-> POS)
const PosShopManagement = lazy(() => import('./../pages/Connections/PosShopManagement'));
const PosPayments = lazy(() => import('./../pages/Connections/PosPayments'));
const PosViewRecordPage = lazy(() => import('./../pages/Connections/PosViewRecordPage'));
// Finance
const FinanceForm = lazy(() => import('./../pages/Finance/FinanceForm'));
const LoanList = lazy(() => import('./../pages/Finance/LoanList'));
const CropFinanceList = lazy(() => import('./../pages/Finance/CropFinanceList'));

// expense-management
const ShopExpenses = lazy(() => import('./../pages/Shops/ShopExpenses'));
const Chat = lazy(() => import('../pages/Apps/Chat'));
const Scrumboard = lazy(() => import('../pages/Apps/Scrumboard'));
const Calendar = lazy(() => import('../pages/Apps/Calendar'));
const List = lazy(() => import('../pages/Apps/Invoice/List'));
const Preview = lazy(() => import('../pages/Apps/Invoice/Preview'));
const Add = lazy(() => import('../pages/Apps/Invoice/Add'));
const Edit = lazy(() => import('../pages/Apps/Invoice/Edit'));
const Tabs = lazy(() => import('../pages/Components/Tabs'));
const Accordians = lazy(() => import('../pages/Components/Accordians'));
const Modals = lazy(() => import('../pages/Components/Modals'));
const Cards = lazy(() => import('../pages/Components/Cards'));
const Carousel = lazy(() => import('../pages/Components/Carousel'));
const Countdown = lazy(() => import('../pages/Components/Countdown'));
const Counter = lazy(() => import('../pages/Components/Counter'));
const SweetAlert = lazy(() => import('../pages/Components/SweetAlert'));
const Timeline = lazy(() => import('../pages/Components/Timeline'));
const Notification = lazy(() => import('../pages/Components/Notification'));
const MediaObject = lazy(() => import('../pages/Components/MediaObject'));
const ListGroup = lazy(() => import('../pages/Components/ListGroup'));
const PricingTable = lazy(() => import('../pages/Components/PricingTable'));
const LightBox = lazy(() => import('../pages/Components/LightBox'));
const Alerts = lazy(() => import('../pages/Elements/Alerts'));
const Avatar = lazy(() => import('../pages/Elements/Avatar'));
const Badges = lazy(() => import('../pages/Elements/Badges'));
const Breadcrumbs = lazy(() => import('../pages/Elements/Breadcrumbs'));
const Buttons = lazy(() => import('../pages/Elements/Buttons'));
const Buttongroups = lazy(() => import('../pages/Elements/Buttongroups'));
const Colorlibrary = lazy(() => import('../pages/Elements/Colorlibrary'));
const DropdownPage = lazy(() => import('../pages/Elements/DropdownPage'));
const Infobox = lazy(() => import('../pages/Elements/Infobox'));
const Jumbotron = lazy(() => import('../pages/Elements/Jumbotron'));
const Loader = lazy(() => import('../pages/Elements/Loader'));
const Pagination = lazy(() => import('../pages/Elements/Pagination'));
const Popovers = lazy(() => import('../pages/Elements/Popovers'));
const Progressbar = lazy(() => import('../pages/Elements/Progressbar'));
const Search = lazy(() => import('../pages/Elements/Search'));
const Tooltip = lazy(() => import('../pages/Elements/Tooltip'));
const Treeview = lazy(() => import('../pages/Elements/Treeview'));
const Typography = lazy(() => import('../pages/Elements/Typography'));
const Widgets = lazy(() => import('../pages/Widgets'));
const FontIcons = lazy(() => import('../pages/FontIcons'));
const DragAndDrop = lazy(() => import('../pages/DragAndDrop'));
const Tables = lazy(() => import('../pages/Tables'));
const Basic = lazy(() => import('../pages/DataTables/Basic'));
const Advanced = lazy(() => import('../pages/DataTables/Advanced'));
const Skin = lazy(() => import('../pages/DataTables/Skin'));
const OrderSorting = lazy(() => import('../pages/DataTables/OrderSorting'));
const MultiColumn = lazy(() => import('../pages/DataTables/MultiColumn'));
const MultipleTables = lazy(() => import('../pages/DataTables/MultipleTables'));
const AltPagination = lazy(() => import('../pages/DataTables/AltPagination'));
const Checkbox = lazy(() => import('../pages/DataTables/Checkbox'));
const RangeSearch = lazy(() => import('../pages/DataTables/RangeSearch'));
const Export = lazy(() => import('../pages/DataTables/Export'));
const ColumnChooser = lazy(() => import('../pages/DataTables/ColumnChooser'));
const Profile = lazy(() => import('../pages/Users/Profile'));
const AccountSetting = lazy(() => import('../pages/Users/AccountSetting'));
const KnowledgeBase = lazy(() => import('../pages/Pages/KnowledgeBase'));
const ContactUsBoxed = lazy(() => import('../pages/Pages/ContactUsBoxed'));
const ContactUsCover = lazy(() => import('../pages/Pages/ContactUsCover'));
const Faq = lazy(() => import('../pages/Pages/Faq'));
const ComingSoonBoxed = lazy(() => import('../pages/Pages/ComingSoonBoxed'));
const ComingSoonCover = lazy(() => import('../pages/Pages/ComingSoonCover'));
const ERROR404 = lazy(() => import('../pages/Pages/Error404'));
const ERROR500 = lazy(() => import('../pages/Pages/Error500'));
const ERROR503 = lazy(() => import('../pages/Pages/Error503'));
const Maintenence = lazy(() => import('../pages/Pages/Maintenence'));
const Landing = lazy(() => import('../pages/Landing'));
const LoginBoxed = lazy(() => import('../pages/Authentication/LoginBoxed'));
const CustomerLogin = lazy(() => import('../pages/Authentication/CustomerLogin'));
const ShopOwnerLogin = lazy(() => import('../pages/Authentication/ShopOwnerLogin'));
const AdminLogin = lazy(() => import('../pages/Authentication/AdminLogin'));
const TeamMemberLogin = lazy(() => import('../pages/Authentication/TeamMemberLogin'));
const Pricing = lazy(() => import('../pages/Pricing'));
const ForgotPassword = lazy(() => import('../pages/Authentication/ForgotPassword'));
const RegisterBoxed = lazy(() => import('../pages/Authentication/RegisterBoxed'));
const UnlockBoxed = lazy(() => import('../pages/Authentication/UnlockBox'));
const RecoverIdBoxed = lazy(() => import('../pages/Authentication/RecoverIdBox'));
const LoginCover = lazy(() => import('../pages/Authentication/LoginCover'));
const RegisterCover = lazy(() => import('../pages/Authentication/RegisterCover'));
const RecoverIdCover = lazy(() => import('../pages/Authentication/RecoverIdCover'));
const UnlockCover = lazy(() => import('../pages/Authentication/UnlockCover'));
const About = lazy(() => import('../pages/About'));
const Error = lazy(() => import('../components/Error'));
const Charts = lazy(() => import('../pages/Charts'));
const FormBasic = lazy(() => import('../pages/Forms/Basic'));
const FormInputGroup = lazy(() => import('../pages/Forms/InputGroup'));
const FormLayouts = lazy(() => import('../pages/Forms/Layouts'));
const Validation = lazy(() => import('../pages/Forms/Validation'));
const InputMask = lazy(() => import('../pages/Forms/InputMask'));
const Select2 = lazy(() => import('../pages/Forms/Select2'));
const Touchspin = lazy(() => import('../pages/Forms/TouchSpin'));
const CheckBoxRadio = lazy(() => import('../pages/Forms/CheckboxRadio'));
const Switches = lazy(() => import('../pages/Forms/Switches'));
const Wizards = lazy(() => import('../pages/Forms/Wizards'));
const FileUploadPreview = lazy(() => import('../pages/Forms/FileUploadPreview'));
const QuillEditor = lazy(() => import('../pages/Forms/QuillEditor'));
const MarkDownEditor = lazy(() => import('../pages/Forms/MarkDownEditor'));
const DateRangePicker = lazy(() => import('../pages/Forms/DateRangePicker'));
const Clipboard = lazy(() => import('../pages/Forms/Clipboard'));

const routes = [
    // Public
    {
        path: '/',
        element: <Landing />,
        layout: 'blank',
    },
    {
        path: '/login',
        element: <LoginBoxed />,
        layout: 'blank',
    },
    {
        path: '/customer-login',
        element: <CustomerLogin />,
        layout: 'blank',
    },
    {
        path: '/shopowner-login',
        element: <ShopOwnerLogin />,
        layout: 'blank',
    },
    {
        path: '/admin-login',
        element: <AdminLogin />,
        layout: 'blank',
    },
    {
        path: '/team-member-login',
        element: <TeamMemberLogin />,
        layout: 'blank',
    },
    {
        path: '/pos-login',
        element: <PesticidePosLogin />,
        layout: 'blank',
    },
    {
        path: '/pricing',
        element: <Pricing />,
        layout: 'blank',
    },
    {
        path: '/dashboard',
        element: <DashboardRouter />,
        protected: true,
        allowedRoles: ['0', '1', '2', '3', 'customer']
    },
    {
        path: '/pos-shop-management',
        element: <PosShopManagement />,
        protected: true,
        allowedRoles: ['1']
    },
    {
        path: '/pos-payments',
        element: <PosPayments />,
        protected: true,
        allowedRoles: ['1']
    },
    {
        path: '/shop',
        element: <Shop />,
        protected: true,
        allowedRoles: ['0', '2', '3'] // Admin + team with view_shops
    },
    {
        path: '/shop/view/:shopId',
        element: <ShopView />,
        protected: true,
        allowedRoles: ['0', '2', '3']
    },
    {
        path: '/shop/:shopId/customers',
        element: <AdminShopCustomers />,
        protected: true,
        allowedRoles: ['0', '2', '3'] // Admin + team with view_shops
    },
    {
        path: '/shop/:shopId/finance',
        element: <AdminShopFinance />,
        protected: true,
        allowedRoles: ['0', '2', '3']
    },
    {
        path: '/shop/:shopId/expenses',
        element: <AdminShopExpenses />,
        protected: true,
        allowedRoles: ['0', '2', '3']
    },
    {
        path: '/shopowner',
        element: <UserShopOwner />,
        protected: true,
        allowedRoles: ['0', '2', '3'] // Admin + team with view_shop_owners
    },
    {
        path: '/creatshopowner',
        element: <CreateUserShopOwner />,
        protected: true,
        allowedRoles: ['0', '2', '3']
    },
    {
        path: '/editshopowner/:userId',
        element: <EditShopOwner />,
        protected: true,
        allowedRoles: ['0', '2', '3']
    },
    {
        path: '/subcriptions',
        element: <ViewAllSubcriptions />,
        protected: true,
        allowedRoles: ['0', '2', '3'] // Admin + team with manage_subscriptions
    },
    {
        path: '/addsubcription',
        element: <AddNewSubcription />,
        protected: true,
        allowedRoles: ['0', '2', '3']
    },
    {
        path: '/editsubcription/:id',
        element: <EditSubcription />,
        protected: true,
        allowedRoles: ['0', '2', '3']
    },
    {
        path: '/SubcriptionHistory',
        element: <SubcriptionHistory />,
        protected: true,
        // Shop owners need full history from profile; admin/team retain access
        allowedRoles: ['0', '1', '2', '3']
    },
    {
        path: '/viewHistoryspecifc/:id',
        element: <ViewHistoryspecifc />,
        protected: true,
        allowedRoles: ['0', '1', '2', '3']
    },
    // Pesticide POS (admin)
    {
        path: '/pesticide-pos/register',
        element: <RegisterPesticideShop />,
        protected: true,
        allowedRoles: ['0']
    },
    {
        path: '/pesticide-pos/subscriptions',
        element: <PesticidePosSubscriptions />,
        protected: true,
        allowedRoles: ['0']
    },
    {
        path: '/pesticide-pos/subscriptions/edit/:id',
        element: <EditPosSubscription />,
        protected: true,
        allowedRoles: ['0']
    },
    {
        path: '/pesticide-pos/subscription-history',
        element: <PosSubscriptionHistory />,
        protected: true,
        allowedRoles: ['0']
    },
    {
        path: '/pesticide-pos/shops',
        element: <PesticideShopList />,
        protected: true,
        allowedRoles: ['0']
    },
    {
        path: '/pesticide-pos/owners',
        element: <PosOwnersList />,
        protected: true,
        allowedRoles: ['0']
    },
    {
        path: '/pesticide-pos/shops/edit/:id',
        element: <EditPesticideShop />,
        protected: true,
        allowedRoles: ['0']
    },
    // POS Shop (pesticide shop owner – loginSource=pos, layout: pos)
    {
        path: '/pos/dashboard',
        element: <PosDashboard />,
        protected: true,
        allowedRoles: ['1'],
        layout: 'pos'
    },
    {
        path: '/pos/sale',
        element: <PosSale />,
        protected: true,
        allowedRoles: ['1'],
        layout: 'pos'
    },
    {
        path: '/pos/sale/:id/edit',
        element: <PosSaleEdit />,
        protected: true,
        allowedRoles: ['1'],
        layout: 'pos'
    },
    {
        path: '/pos/products',
        element: <PosProducts />,
        protected: true,
        allowedRoles: ['1'],
        layout: 'pos'
    },
    {
        path: '/pos/sales-history',
        element: <PosSalesHistory />,
        protected: true,
        allowedRoles: ['1'],
        layout: 'pos'
    },
    {
        path: '/pos/customers',
        element: <PosCustomers />,
        protected: true,
        allowedRoles: ['1'],
        layout: 'pos'
    },
    {
        path: '/pos/pending-requests',
        element: <PosPendingRequests />,
        protected: true,
        allowedRoles: ['1'],
        layout: 'pos'
    },
    {
        path: '/pos/commission-shop-management',
        element: <CommissionShopManagement />,
        protected: true,
        allowedRoles: ['1'],
        layout: 'pos'
    },
    {
        path: '/pos/view-record/:shopOwnerId',
        element: <PosViewRecordPage />,
        protected: true,
        allowedRoles: ['1'],
        layout: 'pos'
    },
    {
        path: '/pos/profile',
        element: <PosProfile />,
        protected: true,
        allowedRoles: ['1'],
        layout: 'pos'
    },
    {
        path: '/pos/support',
        element: <SupportMailbox />,
        protected: true,
        allowedRoles: ['1'],
        layout: 'pos'
    },
    {
        path: '/pos/support/list',
        element: <MyTickets />,
        protected: true,
        allowedRoles: ['1'],
        layout: 'pos'
    },
    {
        path: '/pos/support/new',
        element: <CreateTicket />,
        protected: true,
        allowedRoles: ['1'],
        layout: 'pos'
    },
    {
        path: '/pos/support/ticket/:id',
        element: <TicketDetail />,
        protected: true,
        allowedRoles: ['1'],
        layout: 'pos'
    },
    {
        path: '/pos/receipt/:id',
        element: <PosReceipt />,
        protected: true,
        allowedRoles: ['1'],
        layout: 'pos'
    },
    // crops page  
    {
        path: '/cropmenu/:userId/:cropId',
        element: <CropMenuCards />,
        protected: true,
        allowedRoles: ['0', '1']
    }, {
        path: '/getassginshopcrops',
        element: <GetAssginShopCrops />,
        protected: true,
        allowedRoles: ['0', '1']
    },
    {
        path: '/viewcrops',
        element: <ViewAllCrops />,
        protected: true,
        allowedRoles: ['0', '1']
    },
    {
        path: '/addnewcrop',
        element: <AddNewCrop />,
        protected: true,
        allowedRoles: ['0']
    },
    {
        path: '/editcrop/:id',
        element: <EditCrop />,
        protected: true,
        allowedRoles: ['0', '1']
    },
    // Customer page  
    {
        path: '/addnewcustomer',
        element: <AddNewCustomer />,
        protected: true,
        allowedRoles: ['0', '1']
    },
    {
        path: '/editcustomer/:id',
        element: <EditCustomer />,
        protected: true,
        allowedRoles: ['0', '1']
    },
    {
        path: '/customerlist',
        element: <CustomerList />,
        protected: true,
        allowedRoles: ['0', '1']
    },
    {
        path: '/customerbalance',
        element: <CustomerBalance />,
        protected: true,
        allowedRoles: ['0', '1']
    },
    // Expenses Management
    {
        path: '/expense-management',
        element: <ShopExpenses />,
        protected: true,
        allowedRoles: ['0', '1']
    },
    // analytics page  
    {
        path: '/analytics',
        element: <Analytics />,
        protected: true,
        allowedRoles: ['customer']
    },
    // Finance - More specific routes first (must come before /finance)
    {
        path: '/finance/crop/:cropId',
        element: <CropFinanceList />,
        protected: true,
        allowedRoles: ['0', '1']
    },
    {
        path: '/finance-form/:userId/:cropId',
        element: <FinanceForm />,
        protected: true
    },
    // finance page - General route after specific ones
    {
        path: '/finance',
        element: <Finance />,
        protected: true
    },
    // receipt
    {
        path: '/new-dana-receipt/:userId/:cropId',
        element: <AddDanaMandiOrder />,
        protected: true
    },
    {
        path: '/new-vegetable-receipt/:userId/:cropId',
        element: <AddVegetableOrder />,
        protected: true
    },
    {
        path: '/crop-receipt-list/:userId/:cropId',
        element: <DanaMandiCropOrderList />,
        protected: true
    },
    {
        path: '/crop-buyer-list/:userId/:cropId',
        element: <BuyerList />,
        protected: true
    },
    {
        path: '/crop-malakhta-list/:userId/:cropId',
        element: <MalakhtaList />,
        protected: true
    },
    {
        path: '/crop-customer-list/:userId/:cropId',
        element: <DanaMandiCustomerList />,
        protected: true
    },
    {
        path: '/scrop-customer-list/:shopId/:cropId/:cusId',
        element: <DanaMandiCustomerOrderList />,
        protected: true
    },
    {
        path: '/loan/:userId/:cropId',
        element: <LoanList />,
        protected: true
    },
    // Support tickets – Mailbox-style (shop owner + admin/team)
    {
        path: '/support',
        element: <SupportMailbox />,
        protected: true,
        allowedRoles: ['0', '1', '2', '3']
    },
    {
        path: '/support/list',
        element: <MyTickets />,
        protected: true,
        allowedRoles: ['0', '1', '2', '3']
    },
    {
        path: '/support/new',
        element: <CreateTicket />,
        protected: true,
        allowedRoles: ['0', '1', '2', '3']
    },
    {
        path: '/support/ticket/:id',
        element: <TicketDetail />,
        protected: true,
        allowedRoles: ['0', '1', '2', '3']
    },
    // Admin – All tickets (admin/team only)
    {
        path: '/support/all',
        element: <SupportTicketsAll />,
        protected: true,
        allowedRoles: ['0', '2', '3']
    },
    // Admin – Team (admin + sub-admin + team member with view_team)
    {
        path: '/admin/team',
        element: <TeamList />,
        protected: true,
        allowedRoles: ['0', '2', '3']
    },
    {
        path: '/admin/team/add',
        element: <AddTeamMember />,
        protected: true,
        allowedRoles: ['0', '2', '3']
    },
    {
        path: '/history/:userId/:cropId',
        element: <CropHistory />,
        protected: true
    },
    {
        path: '/crop-pos-record/:userId/:cropId',
        element: <CropPosRecord />,
        protected: true
    },
    // crypto page
    {
        path: '/crypto',
        element: <Crypto />,
        protected: true
    },
    {
        path: '/apps/todolist',
        element: <Todolist />,
        protected: true
    },
    {
        path: '/apps/notes',
        element: <Notes />,
        protected: true
    },
    {
        path: '/apps/contacts',
        element: <Contacts />,
        protected: true
    },
    {
        path: '/apps/mailbox',
        element: <Mailbox />,
        protected: true
    },
    {
        path: '/apps/invoice/list',
        element: <List />,
        protected: true
    },
    // Apps page
    {
        path: '/apps/chat',
        element: <Chat />,
        protected: true
    },
    {
        path: '/apps/scrumboard',
        element: <Scrumboard />,
        protected: true
    },
    {
        path: '/apps/calendar',
        element: <Calendar />,
        protected: true,
        allowedRoles: ['0', '1', '2', '3'] // Admin, Shop Owner, Sub Admin, Team Member – personal planner
    },
    // preview page
    {
        path: '/apps/invoice/preview',
        element: <Preview />,
        protected: true
    },
    {
        path: '/apps/invoice/add',
        element: <Add />,
        protected: true
    },
    {
        path: '/apps/invoice/edit',
        element: <Edit />,
        protected: true
    },
    // components page
    {
        path: '/components/tabs',
        element: <Tabs />,
        protected: true
    },
    {
        path: '/components/accordions',
        element: <Accordians />,
        protected: true
    },
    {
        path: '/components/modals',
        element: <Modals />,
        protected: true
    },
    {
        path: '/components/cards',
        element: <Cards />,
        protected: true
    },
    {
        path: '/components/carousel',
        element: <Carousel />,
        protected: true
    },
    {
        path: '/components/countdown',
        element: <Countdown />,
        protected: true
    },
    {
        path: '/components/counter',
        element: <Counter />,
        protected: true
    },
    {
        path: '/components/sweetalert',
        element: <SweetAlert />,
        protected: true
    },
    {
        path: '/components/timeline',
        element: <Timeline />,
        protected: true
    },
    {
        path: '/components/notifications',
        element: <Notification />,
        protected: true
    },
    {
        path: '/components/media-object',
        element: <MediaObject />,
        protected: true
    },
    {
        path: '/components/list-group',
        element: <ListGroup />,
        protected: true
    },
    {
        path: '/components/pricing-table',
        element: <PricingTable />,
        protected: true
    },
    {
        path: '/components/lightbox',
        element: <LightBox />,
        protected: true
    },
    // elements page
    {
        path: '/elements/alerts',
        element: <Alerts />,
        protected: true
    },
    {
        path: '/elements/avatar',
        element: <Avatar />,
        protected: true
    },
    {
        path: '/elements/badges',
        element: <Badges />,
        protected: true
    },
    {
        path: '/elements/breadcrumbs',
        element: <Breadcrumbs />,
        protected: true
    },
    {
        path: '/elements/buttons',
        element: <Buttons />,
        protected: true
    },
    {
        path: '/elements/buttons-group',
        element: <Buttongroups />,
        protected: true
    },
    {
        path: '/elements/color-library',
        element: <Colorlibrary />,
        protected: true
    },
    {
        path: '/elements/dropdown',
        element: <DropdownPage />,
        protected: true
    },
    {
        path: '/elements/infobox',
        element: <Infobox />,
        protected: true
    },
    {
        path: '/elements/jumbotron',
        element: <Jumbotron />,
        protected: true
    },
    {
        path: '/elements/loader',
        element: <Loader />,
        protected: true
    },
    {
        path: '/elements/pagination',
        element: <Pagination />,
        protected: true
    },
    {
        path: '/elements/popovers',
        element: <Popovers />,
        protected: true
    },
    {
        path: '/elements/progress-bar',
        element: <Progressbar />,
        protected: true
    },
    {
        path: '/elements/search',
        element: <Search />,
        protected: true
    },
    {
        path: '/elements/tooltips',
        element: <Tooltip />,
        protected: true
    },
    {
        path: '/elements/treeview',
        element: <Treeview />,
        protected: true
    },
    {
        path: '/elements/typography',
        element: <Typography />,
        protected: true
    },

    // charts page
    {
        path: '/charts',
        element: <Charts />,
        protected: true
    },
    // widgets page
    {
        path: '/widgets',
        element: <Widgets />,
        protected: true
    },
    //  font-icons page
    {
        path: '/font-icons',
        element: <FontIcons />,
        protected: true
    },
    //  Drag And Drop page
    {
        path: '/dragndrop',
        element: <DragAndDrop />,
    },
    //  Tables page
    {
        path: '/tables',
        element: <Tables />,
    },
    // Data Tables
    {
        path: '/datatables/basic',
        element: <Basic />,
    },
    {
        path: '/datatables/advanced',
        element: <Advanced />,
    },
    {
        path: '/datatables/skin',
        element: <Skin />,
    },
    {
        path: '/datatables/order-sorting',
        element: <OrderSorting />,
    },
    {
        path: '/datatables/multi-column',
        element: <MultiColumn />,
    },
    {
        path: '/datatables/multiple-tables',
        element: <MultipleTables />,
    },
    {
        path: '/datatables/alt-pagination',
        element: <AltPagination />,
    },
    {
        path: '/datatables/checkbox',
        element: <Checkbox />,
    },
    {
        path: '/datatables/range-search',
        element: <RangeSearch />,
    },
    {
        path: '/datatables/export',
        element: <Export />,
    },
    {
        path: '/datatables/column-chooser',
        element: <ColumnChooser />,
    },
    // Users page
    {
        path: '/users/profile',
        element: <Profile />,
    },
    {
        path: '/users/user-account-settings',
        element: <AccountSetting />,
    },
    // pages
    {
        path: '/pages/knowledge-base',
        element: <KnowledgeBase />,
    },
    {
        path: '/pages/contact-us-boxed',
        element: <ContactUsBoxed />,
        layout: 'blank',
    },
    {
        path: '/pages/contact-us-cover',
        element: <ContactUsCover />,
        layout: 'blank',
    },
    {
        path: '/pages/faq',
        element: <Faq />,
    },
    {
        path: '/pages/coming-soon-boxed',
        element: <ComingSoonBoxed />,
        layout: 'blank',
    },
    {
        path: '/pages/coming-soon-cover',
        element: <ComingSoonCover />,
        layout: 'blank',
    },
    {
        path: '/pages/error404',
        element: <ERROR404 />,
        layout: 'blank',
    },
    {
        path: '/pages/error500',
        element: <ERROR500 />,
        layout: 'blank',
    },
    {
        path: '/pages/error503',
        element: <ERROR503 />,
        layout: 'blank',
    },
    {
        path: '/pages/maintenence',
        element: <Maintenence />,
        layout: 'blank',
    },
    //Authentication
    {
        path: '/auth/boxed-signin',
        element: <LoginBoxed />,
        layout: 'blank',
    },
    {
        path: '/forgotpassword',
        element: <ForgotPassword />,
        layout: 'blank',
    },
    // {
    //     path: '/auth/boxed-signup',
    //     element: <RegisterBoxed />,
    //     layout: 'blank',
    // },
    {
        path: '/auth/boxed-lockscreen',
        element: <UnlockBoxed />,
        layout: 'blank',
    },
    {
        path: '/auth/boxed-password-reset',
        element: <RecoverIdBoxed />,
        layout: 'blank',
    },
    {
        path: '/auth/cover-login',
        element: <LoginCover />,
        layout: 'blank',
    },
    {
        path: '/auth/cover-register',
        element: <RegisterCover />,
        layout: 'blank',
    },
    {
        path: '/auth/cover-lockscreen',
        element: <UnlockCover />,
        layout: 'blank',
    },
    {
        path: '/auth/cover-password-reset',
        element: <RecoverIdCover />,
        layout: 'blank',
    },
    //forms page
    {
        path: '/forms/basic',
        element: <FormBasic />,
    },
    {
        path: '/forms/input-group',
        element: <FormInputGroup />,
    },
    {
        path: '/forms/layouts',
        element: <FormLayouts />,
    },
    {
        path: '/forms/validation',
        element: <Validation />,
    },
    {
        path: '/forms/input-mask',
        element: <InputMask />,
    },
    {
        path: '/forms/select2',
        element: <Select2 />,
    },
    {
        path: '/forms/touchspin',
        element: <Touchspin />,
    },
    {
        path: '/forms/checkbox-radio',
        element: <CheckBoxRadio />,
    },
    {
        path: '/forms/switches',
        element: <Switches />,
    },
    {
        path: '/forms/wizards',
        element: <Wizards />,
    },
    {
        path: '/forms/file-upload',
        element: <FileUploadPreview />,
    },
    {
        path: '/forms/quill-editor',
        element: <QuillEditor />,
    },
    {
        path: '/forms/markdown-editor',
        element: <MarkDownEditor />,
    },
    {
        path: '/forms/date-picker',
        element: <DateRangePicker />,
    },
    {
        path: '/forms/clipboard',
        element: <Clipboard />,
    },
    {
        path: '/about',
        element: <About />,
        layout: 'blank',
    },
    {
        path: '*',
        element: <Error />,
        layout: 'blank',
    },
];

export { routes };
