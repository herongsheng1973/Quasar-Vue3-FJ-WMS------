const routes = [
  {
    path: '/',
    component: () => import('layouts/MainLayout.vue'),
    children: [
      { path: '', component: () => import('pages/IndexPage.vue') },
      {
        path: 'register',
        component: () => import('pages/RegisterPage2.vue'),
        meta: { requiresAuth: false },
      },
      {
        path: 'dashboard',
        component: () => import('pages/DashboardPage.vue'),
        meta: {
          requiresAuth: true,
        },
      },
      {
        path: 'login',
        component: () => import('pages/LoginPage2.vue'),
        meta: { requiresAuth: false },
      },

      {
        path: 'profile',
        component: () => import('pages/ProfilePage.vue'),
      },
      {
        path: 'change-password',
        component: () => import('pages/ChangePasswordPage.vue'),
      },
      {
        path: 'users',
        name: 'user-management',
        component: () => import('pages/UserManagement.vue'),
        meta: { requiresAdmin: true },
      },
      {
        path: 'roles',
        name: 'role-management',
        component: () => import('pages/accounts/RolesPage.vue'),
        meta: { requiresAdmin: true },
      },
      {
        path: 'permissions',
        name: 'permission-management',
        component: () => import('pages/accounts/PermissionsPage.vue'),
        meta: { requiresAdmin: true },
      },
      {
        path: 'menu',
        component: () => import('pages/accounts/MenusPage.vue'),
        meta: { requiresAdmin: true },
      },
      {
        path: 'logs',
        component: () => import('pages/LogManagement.vue'),
      },
      {
        path: 'backups',
        component: () => import('pages/BackupManagement.vue'),
      },
      {
        path: 'reports',
        component: () => import('pages/ReportManager.vue'),
      },
      {
        path: 'categories',
        component: () => import('pages/CategoriesManagement.vue'),
      },
      {
        path: 'products',
        component: () => import('pages/ProductManagement.vue'),
      },
      {
        path: 'warehouses',
        component: () => import('pages/WarehouseManagement.vue'),
      },
      {
        path: 'locations',
        component: () => import('pages/LocationManagement.vue'),
      },
      {
        path: 'product-skus',
        component: () => import('pages/ProductSkuManagement.vue'),
        meta: { title: '产品SKU管理', icon: 'list' },
      },
      {
        path: 'location-skus',
        component: () => import('pages/LocationSkuManagement.vue'),
      },

      {
        path: 'inventory-records',
        component: () => import('pages/InventoryRecordsManagement.vue'),
      },
      {
        path: 'transactions',
        name: 'TransactionManagement',
        component: () => import('pages/TransactionManagement.vue'),
        meta: { title: '交易管理', icon: 'history' },
      },
      {
        path: 'stock-in',
        name: 'StockInManagement',
        component: () => import('src/pages/operations/stock-in/StockInManagement.vue'),
        meta: { title: '库存入库', icon: 'arrow_back' },
      },
      {
        path: '/operations/stock-in/create',
        name: 'StockInCreate',
        component: () => import('src/pages/operations/stock-in/StockInCreatePage.vue'),
        meta: { title: '新增入库单' },
      },
      {
        path: 'operations/stock-in/edit/:id',
        name: 'StockInEdit',
        component: () => import('src/pages/operations/stock-in/StockInEditPage.vue'),
        meta: { title: '编辑入库单' },
      },
      {
        path: 'stock-out',
        name: 'StockOutManagement',
        component: () => import('src/pages/operations/stock-out/StockOutManagement.vue'),
        meta: { title: '库存出库', icon: 'arrow_forward' },
      },
      {
        path: '/operations/stock-out/create',
        name: 'StockOutCreate',
        component: () => import('pages/operations/stock-out/StockOutCreatePage.vue'),
        meta: { title: '新增出库单' },
      },
      {
        path: '/operations/stock-out/edit/:id',
        name: 'StockOutEdit',
        component: () => import('pages/operations/stock-out/StockOutEditPage.vue'),
        meta: { title: '编辑出库单' },
      },
      {
        path: 'transfers',
        name: 'StockTransferManagement',
        component: () => import('pages/StockTransfer.vue'),
        meta: { title: '库存调拨', icon: 'swap_horiz' },
      },
      {
        path: 'stock-check',
        name: 'StockCheckManagement',
        component: () => import('pages/StockCheck.vue'),
        meta: { title: '库存盘点', icon: 'check' },
      },
      {
        path: 'suppliers',
        name: 'SupplierManagement',
        component: () => import('pages/SupplierManagement.vue'),
        meta: { title: '供应商管理', icon: 'people' },
      },
      {
        path: '/suppliers/:id',
        name: 'SupplierDetail',
        component: () => import('pages/SupplierDetail.vue'),
        meta: { requiresAuth: true },
      },
      {
        path: 'orders',
        name: 'OrderManagement',
        component: () => import('src/pages/OrderManagement.vue'),
        meta: { title: '订单管理', icon: 'receipt' },
      },
      {
        path: 'customers',
        component: () => import('pages/CustomerManagement.vue'),
      },
      {
        path: '/customers/:id',
        name: 'CustomerDetail',
        component: () => import('pages/CustomerDetail.vue'),
        meta: { requiresAuth: true },
      },
      {
        path: 'gobang',
        component: () => import('pages/GobangPage.vue'),
      },
      {
        path: 'game24',
        component: () => import('pages/Game24Page.vue'),
      },
      {
        path: 'files',
        component: () => import('pages/DocumentManagement.vue'),
      },
      {
        path: 'media',
        component: () => import('pages/MediaManagement.vue'),
      },

      {
        path: 'todos',
        component: () => import('pages/TodoManagement.vue'),
      },
      {
        path: 'sys-settings',
        component: () => import('pages/SettingManagement.vue'),
      },
      {
        path: 'employee-setting',
        component: () => import('src/pages/EmployeeSetting.vue'),
      },
      {
        path: 'employees-management',
        component: () => import('src/pages/EmployeesManagement.vue'),
      },
      {
        path: 'recorder',
        component: () => import('src/pages/recorder/RecorderPage.vue'),
      },
      {
        path: '/recorder/detail/:id', // :id 是仪器ID
        name: 'RecorderDetail',
        component: () => import('src/pages/recorder/RecorderDetailPage.vue'),
        meta: { title: '记录详情' },
      },
      {
        path: '/recorder/log/:id',
        name: 'RecorderLog',
        component: () => import('src/pages/recorder/RecorderLogPage.vue'),
        meta: { requiresAuth: true },
      },
      {
        path: 'recorder/component/:id',
        name: 'RecorderComponent',
        component: () => import('src/pages/recorder/RecorderComponent.vue'),
        meta: { title: '仪器组件管理' },
      },
      {
        path: '/recorder/accessory/:id',
        name: 'RecorderAccessoryPage',
        component: () => import('src/pages/recorder/RecorderAccessoryPage.vue'),
        meta: { title: '仪器附件管理' },
      },
      {
        path: 'worklog',
        name: 'WorkLogTimeline',
        component: () => import('src/pages/WorkLogTimeline.vue'),
        meta: { title: '工作日志', icon: 'history', requiresAuth: true },
      },
      {
        path: 'analytics',
        name: 'AnalyticsManagement',
        component: () => import('src/pages/AnalyticsManagement.vue'),
        meta: { title: '数据分析', icon: 'build' },
      },
      {
        path: 'tasks',
        name: 'TaskManagement',
        component: () => import('src/pages/TaskManagement.vue'),
        meta: { title: '任务管理', icon: 'list', requiresAuth: true },
      },

      // ====================== 新增：项目管理 / 设备采集全模块路由 ======================
      {
        path: '/device-total',
        name: 'DeviceTotal',
        component: () => import('src/pages/cableshop/DeviceTotal.vue'),
        meta: { title: '设备总表', requiresAuth: true },
      },
      {
        path: '/monthly-summary',
        name: 'MonthlySummary',
        component: () => import('src/pages/cableshop/MonthlySummaryManage.vue'),
        meta: { title: '设备总表月度统计', requiresAuth: true },
      },
      {
        path: '/lost-detail',
        name: 'EquipmentLostDetail',
        component: () => import('src/pages/cableshop/EquipmentLostDetail.vue'),
        meta: { title: '设备丢失明细', requiresAuth: true },
      },
      {
        path: '/lost-station',
        name: 'LostEquipmentStation',
        component: () => import('src/pages/cableshop/LostEquipmentStation.vue'),
        meta: { title: '丢失设备站号', requiresAuth: true },
      },
      {
        path: '/cableshop-prod',
        name: 'CableShopProduction',
        component: () => import('src/pages/cableshop/CableShopProduction.vue'),
        meta: { title: 'CableShop管理', requiresAuth: true },
      },
      {
        path: '/cableshop_excel',
        name: 'ExcelImportExport',
        component: () => import('src/pages/cableshop/ExcelImportExport.vue'),
        meta: { title: 'Excel导入导出', requiresAuth: true },
      },
      {
        path: '/cableshop-dashboard',
        name: 'CableShopDashboard',
        component: () => import('src/pages/UnderConstruction.vue'),
        meta: { title: 'CableShop仪表盘', requiresAuth: true },
      },
      // 项目数据导入
      {
        path: '/project-setting',
        name: 'ProjectSetting',
        component: () => import('src/pages/projects/ProjectSetting.vue'),
        meta: { title: '项目设置', requiresAuth: true },
      },
      {
        path: '/project-layout',
        name: 'ReceiverLineManagement',
        component: () => import('src/pages/projects/ReceiverLineManage.vue'),
        meta: { title: '接收点数据管理', requiresAuth: true },
      },
      {
        path: '/project-recording',
        name: 'SourcePointList',
        component: () => import('src/pages/projects/SourcePointList.vue'),
        meta: { title: '源点数据管理', requiresAuth: true },
      },
      {
        path: '/project-excel',
        name: 'ProjectExcelImport',
        component: () => import('src/pages/projects/ProjectExcelImport.vue'),
        meta: { title: '项目数据导入', requiresAuth: true },
      },
      // ==================================================================================
    ],
  },
  {
    path: '/:catchAll(.*)*',
    component: () => import('pages/ErrorNotFound.vue'),
  },
]

export default routes
