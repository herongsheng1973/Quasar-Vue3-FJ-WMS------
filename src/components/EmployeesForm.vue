<template>
  <q-page class="q-px-md">
    <!-- 页面标题和操作按钮 -->
    <div class="col-12 flex justify-between items-center mb-6 flex-wrap gap-4">
      <div>
        <h5 class="text-h5 q-ma-none">员工管理</h5>
        <p class="text-grey text-subtitle2">管理员工基本信息</p>
      </div>
      <div class="flex gap-2 flex-wrap">
        <!-- 新增员工按钮 -->
        <q-btn color="primary" label="新增员工" @click="openFormDialog('add')" />
        <!-- 员工导入 -->
        <q-btn-dropdown color="secondary" label="员工导入" icon="upload">
          <q-list>
            <q-item clickable v-close-popup @click="openImportDialog('init')">
              <q-item-section avatar>
                <q-icon name="database" />
              </q-item-section>
              <q-item-section>
                <q-item-label>初始导入</q-item-label>
                <q-item-label caption>覆盖现有数据</q-item-label>
              </q-item-section>
            </q-item>
            <q-item clickable v-close-popup @click="openImportDialog('normal')">
              <q-item-section avatar>
                <q-icon name="playlist_add" />
              </q-item-section>
              <q-item-section>
                <q-item-label>普通导入</q-item-label>
                <q-item-label caption>新增或更新数据</q-item-label>
              </q-item-section>
            </q-item>
            <q-separator />
            <q-item clickable v-close-popup @click="downloadInitTemplate">
              <q-item-section avatar>
                <q-icon name="file_download" />
              </q-item-section>
              <q-item-section>
                <q-item-label>下载初始模板</q-item-label>
              </q-item-section>
            </q-item>
            <q-item clickable v-close-popup @click="downloadNormalTemplate">
              <q-item-section avatar>
                <q-icon name="file_download" />
              </q-item-section>
              <q-item-section>
                <q-item-label>下载普通模板</q-item-label>
              </q-item-section>
            </q-item>
          </q-list>
        </q-btn-dropdown>
        <!-- 导出员工 -->
        <q-btn-dropdown color="primary" label="导出员工" icon="download">
          <q-list>
            <q-item clickable v-close-popup @click="handleExportEmployees('all')">
              <q-item-section avatar>
                <q-icon name="file_download" />
              </q-item-section>
              <q-item-section>
                <q-item-label>导出全部</q-item-label>
                <q-item-label caption>导出所有员工记录</q-item-label>
              </q-item-section>
            </q-item>
            <q-item clickable v-close-popup @click="handleExportEmployees('filtered')">
              <q-item-section avatar>
                <q-icon name="filter_alt" />
              </q-item-section>
              <q-item-section>
                <q-item-label>导出筛选结果</q-item-label>
                <q-item-label caption>仅导出当前筛选结果</q-item-label>
              </q-item-section>
            </q-item>
          </q-list>
        </q-btn-dropdown>
      </div>
    </div>

    <!-- 筛选条件 -->
    <div class="col-12 q-pa-md bg-white rounded-borders shadow-sm mb-6">
      <q-form @submit="applyFilters">
        <div class="row q-col-gutter-md">
          <!-- 员工姓名/WBC搜索 -->
          <div class="col-md-2 col-sm-6 col-xs-12">
            <q-input v-model="filters.searchQuery" label="搜索员工姓名/WBC" emit-value map-options clearable
              @update:model-value="handleFilterChange" dense />
          </div>

          <!-- 所属机构筛选 -->
          <div class="col-md-2 col-sm-4 col-xs-12">
            <q-select v-model="filters.division" label="所属机构" :options="divisionOptions" option-label="division_name"
              option-value="id" emit-value map-options clearable dense />
          </div>

          <!-- 所属部门筛选 -->
          <div class="col-md-2 col-sm-4 col-xs-12">
            <q-select v-model="filters.department" label="所属部门" :options="departmentOptions"
              option-label="department_name" option-value="id" emit-value map-options clearable dense />
          </div>

          <!-- 所属班组筛选 -->
          <div class="col-md-2 col-sm-4 col-xs-12">
            <q-select v-model="filters.team" label="所属班组" :options="teamOptions" option-label="team_name"
              option-value="id" emit-value map-options clearable dense />
          </div>

          <!-- 员工状态筛选 -->
          <div class="col-md-2 col-sm-4 col-xs-12">
            <q-select v-model="filters.isActive" label="在职状态" :options="statusOptions" option-label="label"
              option-value="value" emit-value map-options clearable @update:model-value="handleFilterChange" dense />
          </div>

          <div class="col-md-1 col-sm-4 col-xs-12">
            <q-btn label="重置" color="secondary" @click="resetFilters" class="full-width" unelevated />
          </div>
          <div class="col-md-1 col-sm-4 col-xs-12">
            <q-btn label="筛选" color="primary" type="submit" class="full-width" unelevated />
          </div>
        </div>
      </q-form>
    </div>

    <!-- 员工记录列表 -->
    <div class="col-12 bg-white rounded-borders shadow-sm">
      <q-table :rows="employees" :columns="columns" v-model:pagination="pagination"
        :rows-per-page-options="[10, 20, 30, 50, 100]" :filter="filters" @request="onRequest" row-key="id"
        :loading="tableLoading">
        <!-- 序号显示模板 -->
        <template #body-cell-index="props">
          <q-td :props="props">
            <div>{{ (pagination.page - 1) * pagination.rowsPerPage + props.rowIndex + 1 }}</div>
          </q-td>
        </template>

        <!-- 员工姓名 -->
        <template #body-cell-employee_name="props">
          <q-td :props="props">
            <div class="row items-center">
              <q-avatar size="32px" class="q-mr-sm">
                <img :src="props.row.avatar || 'https://cdn.quasar.dev/img/boy-avatar.png'" alt="头像">
              </q-avatar>
              <div>
                <div>{{ props.row.employee_name }}</div>
                <div class="text-caption text-grey">{{ props.row.wbc }}</div>
              </div>
            </div>
          </q-td>
        </template>

        <!-- 性别 -->
        <template #body-cell-gender="props">
          <q-td :props="props">
            <q-icon :name="props.row.gender === 'M' ? 'male' : 'female'"
              :color="props.row.gender === 'M' ? 'blue' : 'pink'" size="sm" />
          </q-td>
        </template>

        <!-- 在职状态 -->
        <template #body-cell-is_active="props">
          <q-td :props="props">
            <q-badge :color="getEmployeeStatusColor(props.row)" :label="getEmployeeStatusLabel(props.row)" />
          </q-td>
        </template>

        <!-- 操作按钮 -->
        <template #body-cell-actions="props">
          <q-td :props="props">
            <q-btn size="sm" color="info" icon="visibility" class="q-mr-1" @click="viewEmployeeDetail(props.row)"
              label="查看" />
            <q-btn size="sm" color="accent" icon="edit" @click="editEmployee(props.row)" label="编辑" />
            <q-btn size="sm" color="warning" icon="delete" @click="handleDeleteEmployee(props.row)" label="删除" />
          </q-td>
        </template>

        <template #loading>
          <div class="row items-center justify-center q-pa-md">
            <q-spinner size="40px" color="primary" />
            <span class="q-ml-md text-subtitle1">加载员工记录中...</span>
          </div>
        </template>
      </q-table>
    </div>

    <!-- 查看记录详情弹窗 -->
    <q-dialog v-model="isDetailDialogOpen" persistent>
      <q-card style="width: 600px; max-width: 90vw;">
        <q-card-section>
          <div class="row items-center justify-between">
            <div class="row items-center">
              <q-avatar size="96px" class="q-mr-sm">
                <img :src="employeeDetail.avatar || 'https://cdn.quasar.dev/img/boy-avatar.png'" alt="头像"
                  @error="handleImageError">
              </q-avatar>
              <h5 class="text-h5 q-ma-none">员工详情</h5>
            </div>
            <q-btn icon="close" flat round @click="isDetailDialogOpen = false" />
          </div>
        </q-card-section>

        <q-separator />

        <q-card-section class="q-pt-none">
          <div class="row q-mb-sm">
            <div class="col-4 text-subtitle2">员工编号:</div>
            <div class="col-8">{{ employeeDetail.wbc || '-' }}</div>
          </div>

          <div class="row q-mb-sm">
            <div class="col-4 text-subtitle2">员工姓名:</div>
            <div class="col-8">{{ employeeDetail.employee_name || '-' }}</div>
          </div>

          <div class="row q-mb-sm">
            <div class="col-4 text-subtitle2">性别:</div>
            <div class="col-8">{{ employeeDetail.gender === 'M' ? '男' : employeeDetail.gender === 'F' ? '女' : '-' }}
            </div>
          </div>

          <div class="row q-mb-sm">
            <div class="col-4 text-subtitle2">出生日期:</div>
            <div class="col-8">{{ employeeDetail.date_of_birth ? formatDate(employeeDetail.date_of_birth) : '-' }}</div>
          </div>

          <div class="row q-mb-sm">
            <div class="col-4 text-subtitle2">年龄:</div>
            <div class="col-8">{{ employeeDetail.age || '-' }}</div>
          </div>

          <div class="row q-mb-sm">
            <div class="col-4 text-subtitle2">联系电话:</div>
            <div class="col-8">{{ employeeDetail.phone_number || '-' }}</div>
          </div>

          <div class="row q-mb-sm">
            <div class="col-4 text-subtitle2">身份证号:</div>
            <div class="col-8">{{ employeeDetail.cnic || '-' }}</div>
          </div>

          <div class="row q-mb-sm">
            <div class="col-4 text-subtitle2">邮箱:</div>
            <div class="col-8">{{ employeeDetail.email || '-' }}</div>
          </div>

          <div class="row q-mb-sm">
            <div class="col-4 text-subtitle2">所属机构:</div>
            <div class="col-8">{{ employeeDetail.division_name || '-' }}</div>
          </div>

          <div class="row q-mb-sm">
            <div class="col-4 text-subtitle2">所属部门:</div>
            <div class="col-8">{{ employeeDetail.department_name || '-' }}</div>
          </div>

          <div class="row q-mb-sm">
            <div class="col-4 text-subtitle2">所属班组:</div>
            <div class="col-8">{{ employeeDetail.team_name || '-' }}</div>
          </div>

          <div class="row q-mb-sm">
            <div class="col-4 text-subtitle2">岗位:</div>
            <div class="col-8">{{ employeeDetail.position_name || '-' }}</div>
          </div>

          <div class="row q-mb-sm">
            <div class="col-4 text-subtitle2">入职日期:</div>
            <div class="col-8">{{ employeeDetail.hire_date ? formatDate(employeeDetail.hire_date) : '-' }}</div>
          </div>

          <div class="row q-mb-sm">
            <div class="col-4 text-subtitle2">服务时长:</div>
            <div class="col-8">{{ employeeDetail.service_duration ? `${employeeDetail.service_duration}天` : '-' }}</div>
          </div>

          <div class="row q-mb-sm">
            <div class="col-4 text-subtitle2">是否在职:</div>
            <div class="col-8">
              <q-badge :color="employeeDetail.is_active ? 'positive' : 'negative'"
                :label="employeeDetail.is_active ? '在职' : '离职'" />
            </div>
          </div>

          <div class="row q-mb-sm">
            <div class="col-4 text-subtitle2">创建时间:</div>
            <div class="col-8">{{ employeeDetail.created_at ? formatDate(employeeDetail.created_at) : '-' }}</div>
          </div>

          <div class="row q-mb-sm">
            <div class="col-4 text-subtitle2">创建人:</div>
            <div class="col-8">{{ employeeDetail.created_by_name || '-' }}</div>
          </div>
        </q-card-section>

        <q-card-actions align="right" class="q-pa-md">
          <q-btn label="关闭" color="primary" @click="isDetailDialogOpen = false" />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <q-dialog v-model="isDeleteDialogOpen">
      <q-card>
        <q-card-section>
          <div class="row items-center justify-between">
            <h5 class="text-h5">确认删除</h5>
            <q-btn icon="close" flat round @click="isDeleteDialogOpen = false" />
          </div>
        </q-card-section>
        <q-card-section>
          <p>确定要删除员工 {{ currentEmployee.employee_name }} ({{ currentEmployee.wbc }}) 吗？</p>
          <div class="q-mt-sm">
            <q-radio v-model="isSoftDelete" val="true" label="软删除" class="q-mr-md" />
            <q-radio v-model="isSoftDelete" val="false" label="硬删除" />
          </div>
        </q-card-section>
        <q-card-actions align="right">
          <q-btn label="取消" @click="isDeleteDialogOpen = false" color="secondary" />
          <q-btn label="删除" @click="confirmDeleteEmployee" color="warning" class="text-blue" />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- 新增/编辑表单对话框 -->
    <q-dialog v-model="isFormDialogOpen" persistent>
      <q-card style="width: 700px; max-width: 90vw;">
        <q-card-section>
          <div class="row items-center justify-between">
            <h5 class="text-h5">{{ formMode === 'add' ? '新增员工' : '编辑员工' }}</h5>
            <q-btn icon="close" flat round @click="isFormDialogOpen = false" />
          </div>
        </q-card-section>
        <q-card-section>
          <q-form @submit="handleSubmit">
            <div class="row q-col-gutter-md">
              <!-- 基础信息 -->
              <div class="col-12">
                <div class="text-subtitle1 q-mb-sm">基础信息</div>
              </div>

              <div class="col-6">
                <q-input v-model="currentEmployee.wbc" label="员工编号 *" dense outlined
                  :rules="[val => !!val || '员工编号不能为空']" />
              </div>

              <div class="col-6">
                <q-input v-model="currentEmployee.employee_name" label="员工姓名 *" dense outlined
                  :rules="[val => !!val || '员工姓名不能为空']" />
              </div>

              <div class="col-6">
                <q-select v-model="currentEmployee.gender" label="性别 *" :options="genderOptions" option-label="label"
                  option-value="value" map-options emit-value clearable dense outlined
                  :rules="[val => !!val || '请选择性别']" />
              </div>

              <div class="col-6">
                <q-input v-model="currentEmployee.date_of_birth" label="出生日期" dense outlined mask="date">
                  <template #append>
                    <q-icon name="event" class="cursor-pointer">
                      <q-popup-proxy cover transition-show="scale" transition-hide="scale">
                        <q-date v-model="currentEmployee.date_of_birth" mask="YYYY-MM-DD">
                          <div class="row items-center justify-end">
                            <q-btn v-close-popup label="关闭" color="primary" flat />
                          </div>
                        </q-date>
                      </q-popup-proxy>
                    </q-icon>
                  </template>
                </q-input>
              </div>

              <div class="col-6">
                <q-input v-model="currentEmployee.phone_number" label="联系电话 *" dense outlined
                  :rules="[val => !!val || '联系电话不能为空']" />
              </div>

              <div class="col-6">
                <q-input v-model="currentEmployee.cnic" label="身份证号 *" dense outlined
                  :rules="[val => !!val || '身份证号不能为空']" />
              </div>

              <div class="col-6">
                <q-input v-model="currentEmployee.email" label="邮箱地址" dense outlined type="email" />
              </div>

              <div class="col-6">
                <q-input v-model="currentEmployee.father_name" label="父亲姓名" dense outlined />
              </div>

              <div class="col-12">
                <q-input v-model="currentEmployee.address" label="家庭地址" dense outlined type="textarea" rows="2" />
              </div>

              <!-- 组织架构信息 -->
              <div class="col-12 q-mt-md">
                <div class="text-subtitle1 q-mb-sm">组织架构信息</div>
              </div>

              <div class="col-6">
                <q-select v-model="currentEmployee.division" label="所属机构 *" :options="divisionOptions"
                  option-label="division_name" option-value="id" map-options emit-value clearable dense outlined
                  :rules="[val => !!val || '请选择所属机构']" @update:model-value="onDivisionChange" />
              </div>

              <div class="col-6">
                <q-select v-model="currentEmployee.department" label="所属部门 *" :options="departmentOptions"
                  option-label="department_name" option-value="id" map-options emit-value clearable dense outlined
                  :rules="[val => !!val || '请选择所属部门']" @update:model-value="onDepartmentChange" />
              </div>

              <div class="col-6">
                <q-select v-model="currentEmployee.team" label="所属班组 *" :options="teamOptions" option-label="team_name"
                  option-value="id" map-options emit-value clearable dense outlined
                  :rules="[val => !!val || '请选择所属班组']" />
              </div>

              <div class="col-6">
                <q-select v-model="currentEmployee.position" label="岗位 *" :options="positionOptions"
                  option-label="position_name" option-value="id" map-options emit-value clearable dense outlined
                  :rules="[val => !!val || '请选择岗位']" />
              </div>

              <div class="col-6">
                <q-select v-model="currentEmployee.supervisor" label="直属上级" :options="employeeOptions"
                  option-label="employee_name" option-value="id" map-options emit-value clearable dense outlined />
              </div>

              <div class="col-6">
                <q-select v-model="currentEmployee.grade" label="员工等级" :options="gradeOptions" option-label="label"
                  option-value="value" map-options emit-value clearable dense outlined />
              </div>

              <div class="col-12">
                <q-checkbox v-model="currentEmployee.is_manager" label="是否经理" left-label />
              </div>

              <!-- 雇佣信息 -->
              <div class="col-12 q-mt-md">
                <div class="text-subtitle1 q-mb-sm">雇佣信息</div>
              </div>

              <div class="col-6">
                <q-input v-model="currentEmployee.hire_date" label="入职日期" dense outlined mask="date">
                  <template #append>
                    <q-icon name="event" class="cursor-pointer">
                      <q-popup-proxy cover transition-show="scale" transition-hide="scale">
                        <q-date v-model="currentEmployee.hire_date" mask="YYYY-MM-DD">
                          <div class="row items-center justify-end">
                            <q-btn v-close-popup label="关闭" color="primary" flat />
                          </div>
                        </q-date>
                      </q-popup-proxy>
                    </q-icon>
                  </template>
                </q-input>
              </div>

              <div class="col-6">
                <q-input v-model="currentEmployee.contract_no" label="合同编号" dense outlined />
              </div>

              <div class="col-6">
                <q-input v-model="currentEmployee.salary_grade" label="工资等级" dense outlined />
              </div>

              <div class="col-6">
                <q-input v-model.number="currentEmployee.salary_level" label="工资岗级" dense outlined type="number" />
              </div>

              <div class="col-6">
                <q-input v-model.number="currentEmployee.salary_rate" label="基本工资" dense outlined type="number" />
              </div>
            </div>

            <q-card-actions align="right" class="q-pt-md">
              <q-btn label="取消" @click="isFormDialogOpen = false" color="secondary" />
              <q-btn label="保存" type="submit" color="primary" class="q-ml-sm" />
            </q-card-actions>
          </q-form>
        </q-card-section>
      </q-card>
    </q-dialog>

    <!-- 1. 员工初始化导入弹窗 -->
    <q-dialog v-model="showInitImportDialog" max-width="700px">
      <q-card>
        <q-card-section class="row items-center justify-between">
          <h5 class="text-h5 text-negative">⚠️ 员工初始化导入</h5>
          <q-btn icon="close" flat round @click="closeImportDialogs" />
        </q-card-section>
        <q-card-section class="q-pa-md">
          <div class="space-y-4">
            <!-- 风险提示 -->
            <div class="bg-negative/10 p-3 rounded border border-negative/20">
              <h6 class="text-negative font-medium flex items-center">
                <q-icon name="warning" class="q-mr-sm" />
                重要提醒
              </h6>
              <ul class="text-sm mt-2 space-y-1 text-gray-700">
                <li>1. 初始化导入将<span class="font-medium text-negative">覆盖现有员工数据</span>，适用于系统首次上线或全量数据重置</li>
                <li>2. 若勾选"清空现有数据"，将删除所有员工记录，<span class="font-medium text-negative">操作不可撤销</span></li>
                <li>3. 请确保导入文件包含员工编号、姓名、联系电话等必填字段（建议先下载模板）</li>
              </ul>
            </div>

            <!-- 模板下载 -->
            <div class="flex justify-between items-center">
              <p class="text-sm">请下载模板并按格式填写数据</p>
              <q-btn label="下载员工初始化模板" color="secondary" icon="file_download" size="sm" @click="downloadInitTemplate" />
            </div>

            <!-- 文件上传 -->
            <q-uploader label="选择员工初始化文件（仅支持.xlsx/.xls）" accept=".xlsx, .xls" :max-files="1" @added="handleFileSelected"
              @remove="() => { selectedFile = null; importErrors = []; }" dense class="mt-2">
              <template #file="{ file, remove }">
                <div class="flex items-center justify-between bg-gray-50 p-2 rounded">
                  <div class="flex items-center">
                    <q-icon name="file-excel" color="teal" class="q-mr-sm" />
                    <span class="text-sm">{{ file.name }}</span>
                  </div>
                  <q-btn icon="close" size="sm" flat @click="remove" />
                </div>
              </template>
            </q-uploader>

            <!-- 清空现有数据选项 -->
            <div class="flex items-center mt-4">
              <q-checkbox v-model="initClearExisting" label="清空现有员工数据" color="negative"
                @update:model-value="handleClearConfirm" />
            </div>

            <!-- 导入结果/错误展示 -->
            <div v-if="importErrors.length > 0" class="mt-4">
              <h6 class="text-negative text-sm font-medium">导入失败记录（共{{ importErrors.length }}条）</h6>
              <div class="bg-white border border-gray-200 rounded mt-2 max-h-60 overflow-auto">
                <q-table :rows="importErrors" :columns="importErrorColumns" row-key="row" dense hide-header flat />
              </div>
              <q-btn label="下载员工错误详情" color="negative" size="sm" class="mt-2" @click="downloadImportErrors" dense />
            </div>

            <!-- 初始化成功统计 -->
            <div v-if="importResult" class="mt-4 bg-positive/10 p-3 rounded">
              <h6 class="text-positive font-medium">员工初始化导入成功</h6>
              <ul class="text-sm mt-2 space-y-1">
                <li>成功创建员工记录：{{ importResult.employee_success_count }} 条</li>
                <li>失败记录：{{ importResult.error_count }} 条</li>
              </ul>
            </div>
          </div>
        </q-card-section>
        <q-card-actions align="right" class="q-pa-md">
          <q-btn label="取消" color="secondary" @click="resetInitImportState" />
          <q-btn label="开始员工初始化" color="negative" class="ml-2" @click="handleImport"
            :disable="!selectedFile || importLoading" :loading="importLoading" />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- 2. 普通导入弹窗 -->
    <q-dialog v-model="showNormalImportDialog" max-width="700px">
      <q-card>
        <q-card-section class="row items-center justify-between">
          <h5 class="text-h5">普通员工导入</h5>
          <q-btn icon="close" flat round @click="closeImportDialogs" />
        </q-card-section>
        <q-card-section class="q-pa-md">
          <div class="space-y-4">
            <p class="text-sm">普通员工导入仅新增/更新员工记录，不删除现有数据，适用于日常批量更新</p>
            <div class="flex justify-between items-center">
              <p class="text-sm">请下载模板并按格式填写数据</p>
              <q-btn label="下载普通员工导入模板" color="secondary" icon="file_download" size="sm"
                @click="downloadNormalTemplate" />
            </div>
            <q-uploader label="选择员工普通导入文件（仅支持.xlsx/.xls）" accept=".xlsx, .xls" :max-files="1"
              @added="handleFileSelected" @remove-file="() => { selectedFile = null; importErrors = []; }" dense />
            <div v-if="importErrors.length > 0" class="mt-4">
              <h6 class="text-negative text-sm font-medium">导入失败记录</h6>
              <div class="bg-white border border-gray-200 rounded mt-2 max-h-40 overflow-auto">
                <q-table :rows="importErrors" :columns="importErrorColumns" row-key="row" dense hide-header flat />
              </div>
            </div>
          </div>
        </q-card-section>
        <q-card-actions align="right" class="q-pa-md">
          <q-btn label="取消" color="secondary" @click="showNormalImportDialog = false" />
          <q-btn label="开始员工普通导入" color="primary" class="ml-2" @click="handleImport"
            :disable="!selectedFile || importLoading" :loading="importLoading" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useQuasar } from 'quasar'
import { format, parseISO } from 'date-fns'
import { exportExcel } from 'src/utils/excel-utils'
import { fileUtils } from 'src/services/employeeServiceApi'

// 添加防抖计时器引用
let filterTimer = null

// API导入 - 员工相关接口
import {
  getEmployees,
  getEmployeeDetail,
  createEmployee,
  updateEmployee,
  deleteEmployee,
  softDeleteEmployee,
  downloadEmployeeTemplate,
  exportEmployees,
  importEmployees,
  getDivisions,
  getDepartments,
  getTeams,
  getPositions
} from 'src/services/employeeServiceApi'

// 初始化Quasar
const $q = useQuasar()

// -------------------------- 基础状态变量 --------------------------
const employees = ref([])
const tableLoading = ref(false)
const isDetailDialogOpen = ref(false)
const isDeleteDialogOpen = ref(false)
const isFormDialogOpen = ref(false)
const formMode = ref('add')

// -------------------------- 筛选与分页 --------------------------
const filters = ref({
  searchQuery: '',
  division: null,
  department: null,
  team: null,
  isActive: true
})

const pagination = ref({
  page: 1,
  rowsPerPage: 10,
  sortBy: 'wbc',
  descending: false,
  rowsNumber: 0
})

// -------------------------- 数据模型 --------------------------
const currentEmployee = ref({
  id: null,
  wbc: '',
  employee_name: '',
  father_name: '',
  phone_number: '',
  avatar: '',
  cnic: '',
  gender: '',
  date_of_birth: '',
  home_city: '',
  address: '',
  email: '',
  education: '',
  hire_date: '',
  exit_date: '',
  division: null,
  department: null,
  team: null,
  position: null,
  grade: '',
  supervisor: null,
  is_manager: false,
  contract_no: '',
  salary_grade: '',
  salary_level: 0,
  salary_rate: 0
})

const employeeDetail = ref({})
// -------------------------- 下拉选项配置 --------------------------
const divisionOptions = ref([])
const departmentOptions = ref([])
const teamOptions = ref([])
const positionOptions = ref([])
const employeeOptions = ref([])
const statusOptions = ref([
  { label: '全部', value: null },
  { label: '在职', value: true },
  { label: '离职', value: false }
])
const genderOptions = ref([
  { label: '男', value: 'M' },
  { label: '女', value: 'F' }
])
const gradeOptions = ref([
  { label: '高级', value: 'Senior' },
  { label: '中级', value: 'Inter' },
  { label: '初级', value: 'Junior' }
])

// -------------------------- 删除选项 --------------------------
const isSoftDelete = ref('true')
// -------------------------- 表格配置 --------------------------
const columns = ref([
  { name: 'index', label: '序号', field: '', align: 'left', sortable: true, width: '60px' },
  { name: 'employee_name', label: '员工姓名', field: 'employee_name', align: 'left', sortable: true },
  { name: 'wbc', label: '员工编号', field: 'wbc', align: 'left', sortable: true },
  { name: 'gender', label: '性别', field: 'gender', align: 'left', sortable: true },
  { name: 'phone_number', label: '联系电话', field: 'phone_number', align: 'left', sortable: true },
  { name: 'division_name', label: '所属机构', field: 'division_name', align: 'left', sortable: true },
  { name: 'department_name', label: '所属部门', field: 'department_name', align: 'left', sortable: true },
  { name: 'team_name', label: '所属班组', field: 'team_name', align: 'left', sortable: true },
  { name: 'position_name', label: '岗位', field: 'position_name', align: 'left', sortable: true },
  { name: 'hire_date', label: '入职日期', field: 'hire_date', align: 'left', sortable: true, format: formatDate },
  { name: 'is_active', label: '在职状态', field: 'is_active', align: 'left', sortable: true },
  { name: 'actions', label: '操作', field: 'actions', align: 'center', width: '180px' }
])

// 导入错误表格列
const importErrorColumns = ref([
  { name: 'row', label: '行号', field: 'row', width: '80px' },
  { name: 'data', label: '数据', field: 'data', format: (val) => JSON.stringify(val).slice(0, 50) + '...' },
  { name: 'error', label: '错误原因', field: 'error' }
])

// -------------------------- 工具函数 --------------------------
// 日期格式化
function formatDate(dateString) {
  if (!dateString) return ''
  return format(parseISO(dateString), 'yyyy-MM-dd')
}

// 获取员工状态标签
const getEmployeeStatusLabel = (employee) => {
  if (!employee) return '未知'
  return employee.is_active ? '在职' : '离职'
}

// 获取员工状态颜色
const getEmployeeStatusColor = (employee) => {
  if (!employee) return 'grey'
  return employee.is_active ? 'positive' : 'negative'
}
const handleImageError = (event) => {
  event.target.src = 'https://cdn.quasar.dev/img/boy-avatar.png';
};
// -------------------------- 操作方法 --------------------------
const openFormDialog = (mode, employee = null) => {
  formMode.value = mode
  isFormDialogOpen.value = true

  if (mode === 'edit' && employee) {
    currentEmployee.value = { ...employee }
  } else {
    // 重置为默认值
    currentEmployee.value = {
      id: null,
      wbc: '',
      employee_name: '',
      father_name: '',
      phone_number: '',
      avatar: '',
      cnic: '',
      gender: '',
      date_of_birth: '',
      home_city: '',
      address: '',
      email: '',
      education: '',
      hire_date: '',
      exit_date: '',
      division: null,
      department: null,
      team: null,
      position: null,
      grade: '',
      supervisor: null,
      is_manager: false,
      contract_no: '',
      salary_grade: '',
      salary_level: 0,
      salary_rate: 0
    }
  }
}

// -------------------------- 数据加载函数 --------------------------
// 构建筛选参数
function buildFilterParams() {
  const params = new URLSearchParams()

  // 分页参数
  params.append('page', pagination.value.page)
  params.append('page_size', pagination.value.rowsPerPage)

  // 排序参数
  if (pagination.value.sortBy) {
    const order = pagination.value.descending ? `-${pagination.value.sortBy}` : pagination.value.sortBy
    params.append('ordering', order)
  }

  // 筛选参数
  if (filters.value.searchQuery) {
    params.append('search', filters.value.searchQuery)
  }

  if (filters.value.division) {
    params.append('division', filters.value.division)
  }

  if (filters.value.department) {
    params.append('department', filters.value.department)
  }

  if (filters.value.team) {
    params.append('team', filters.value.team)
  }

  if (filters.value.isActive !== null) {
    const isActiveValue = filters.value.isActive ? 'True' : 'False'
    params.append('is_active', isActiveValue)
  }

  return params
}

// 获取员工列表
const fetchEmployees = async () => {
  try {
    tableLoading.value = true
    const params = buildFilterParams()
    const response = await getEmployees(params)

    if (response.status === 200) {
      employees.value = response.data.results
      pagination.value.rowsNumber = response.data.count
    }
  } catch (error) {
    $q.notify({
      color: 'negative',
      message: error.message || '获取员工失败',
      position: 'top'
    })
  } finally {
    tableLoading.value = false
  }
}

const viewEmployeeDetail = async (employee) => {
  isDetailDialogOpen.value = true
  try {
    const response = await getEmployeeDetail(employee.id)
    if (response.status === 200) {
      employeeDetail.value = response.data
    }
  } catch (error) {
    $q.notify({
      color: 'negative',
      message: error.message || '获取员工详情失败',
      position: 'top'
    })
  }
}

// 获取下拉选项数据
async function fetchSelectOptions() {
  try {
    // 获取机构选项
    const divisionsResponse = await getDivisions()
    if (divisionsResponse.status === 200) {
      divisionOptions.value = divisionsResponse.data.results
    }

    // 获取部门选项
    const departmentsResponse = await getDepartments()
    if (departmentsResponse.status === 200) {
      departmentOptions.value = departmentsResponse.data.results
    }

    // 获取班组选项
    const teamsResponse = await getTeams()
    if (teamsResponse.status === 200) {
      teamOptions.value = teamsResponse.data.results
    }

    // 获取岗位选项
    const positionsResponse = await getPositions()
    if (positionsResponse.status === 200) {
      positionOptions.value = positionsResponse.data.results
    }

    // 获取员工选项（用于上级选择）
    const employeesResponse = await getEmployees()
    if (employeesResponse.status === 200) {
      employeeOptions.value = employeesResponse.data.results
    }
  } catch (error) {
    console.error('获取下拉选项失败:', error)
  }
}

// 当机构改变时，过滤部门选项
const onDivisionChange = (divisionId) => {
  if (!divisionId) {
    currentEmployee.value.department = null
    currentEmployee.value.team = null
    currentEmployee.value.position = null
    return
  }

  // 这里可以添加根据机构过滤部门的逻辑
  // 由于后端已经处理了验证，前端可以不做额外处理
}

// 当部门改变时，过滤班组选项
const onDepartmentChange = (departmentId) => {
  if (!departmentId) {
    currentEmployee.value.team = null
    currentEmployee.value.position = null
    return
  }

  // 这里可以添加根据部门过滤班组的逻辑
  // 由于后端已经处理了验证，前端可以不做额外处理
}

// -------------------------- 新增/编辑处理 --------------------------
// 表单验证
const validateForm = () => {
  if (!currentEmployee.value.wbc?.trim()) {
    $q.notify({
      color: 'negative',
      message: '请输入员工编号',
      position: 'top'
    })
    return false
  }

  if (!currentEmployee.value.employee_name?.trim()) {
    $q.notify({
      color: 'negative',
      message: '请输入员工姓名',
      position: 'top'
    })
    return false
  }

  if (!currentEmployee.value.gender) {
    $q.notify({
      color: 'negative',
      message: '请选择性别',
      position: 'top'
    })
    return false
  }

  if (!currentEmployee.value.phone_number?.trim()) {
    $q.notify({
      color: 'negative',
      message: '请输入联系电话',
      position: 'top'
    })
    return false
  }

  if (!currentEmployee.value.cnic?.trim()) {
    $q.notify({
      color: 'negative',
      message: '请输入身份证号',
      position: 'top'
    })
    return false
  }

  if (!currentEmployee.value.division) {
    $q.notify({
      color: 'negative',
      message: '请选择所属机构',
      position: 'top'
    })
    return false
  }

  if (!currentEmployee.value.department) {
    $q.notify({
      color: 'negative',
      message: '请选择所属部门',
      position: 'top'
    })
    return false
  }

  if (!currentEmployee.value.team) {
    $q.notify({
      color: 'negative',
      message: '请选择所属班组',
      position: 'top'
    })
    return false
  }

  if (!currentEmployee.value.position) {
    $q.notify({
      color: 'negative',
      message: '请选择岗位',
      position: 'top'
    })
    return false
  }

  return true
}

// 处理表单提交
const handleSubmit = async () => {
  if (!validateForm()) return

  try {
    if (formMode.value === 'add') {
      await handleAddEmployee()
    } else if (formMode.value === 'edit') {
      await handleEditEmployee(currentEmployee.value.id)
    }
  } finally {
    isFormDialogOpen.value = false
  }
}

// 添加员工
const handleAddEmployee = async () => {
  try {
    // 清理空字符串字段
    const formData = { ...currentEmployee.value }
    Object.keys(formData).forEach(key => {
      if (typeof formData[key] === 'string' && formData[key].trim() === '') {
        formData[key] = null
      }
    })

    const response = await createEmployee(formData)
    if (response.status === 201) {
      $q.notify({
        color: 'positive',
        message: '添加员工成功',
        position: 'top'
      })
      fetchEmployees()
    }
  } catch (error) {
    $q.notify({
      color: 'negative',
      message: error.message || '添加员工失败',
      position: 'top'
    })
  }
}

// 编辑员工
const editEmployee = async (employee) => {
  formMode.value = 'edit'
  isFormDialogOpen.value = true
  try {
    const response = await getEmployeeDetail(employee.id)
    if (response.status === 200) {
      currentEmployee.value = response.data
    }
  } catch (error) {
    $q.notify({
      color: 'negative',
      message: error.message || '获取员工详情失败',
      position: 'top'
    })
  }
}

// 更新员工
const handleEditEmployee = async (employeeId) => {
  try {
    // 清理空字符串字段
    const formData = { ...currentEmployee.value }
    Object.keys(formData).forEach(key => {
      if (typeof formData[key] === 'string' && formData[key].trim() === '') {
        formData[key] = null
      }
    })

    const response = await updateEmployee(employeeId, formData)
    if (response.status === 200) {
      $q.notify({
        color: 'positive',
        message: '更新员工成功',
        position: 'top'
      })
      fetchEmployees()
    }
  } catch (error) {
    $q.notify({
      color: 'negative',
      message: error.message || '更新员工失败',
      position: 'top'
    })
  }
}

// -------------------------- 删除处理 --------------------------
const handleDeleteEmployee = async (employee) => {
  currentEmployee.value.id = employee.id
  currentEmployee.value.employee_name = employee.employee_name
  currentEmployee.value.wbc = employee.wbc
  isDeleteDialogOpen.value = true
}

// 确认删除员工
const confirmDeleteEmployee = async () => {
  try {
    const deleteMode = isSoftDelete.value === 'true'
    let response
    if (deleteMode) {
      response = await softDeleteEmployee(currentEmployee.value.id)
    } else {
      response = await deleteEmployee(currentEmployee.value.id)
    }
    if (response.status === 204 || response.status === 200) {
      $q.notify({
        color: 'positive',
        message: deleteMode ? '软删除成功' : '硬删除成功',
        position: 'top'
      })
      fetchEmployees()
    }
  } catch (error) {
    $q.notify({
      color: 'negative',
      message: error.message || '删除员工失败',
      position: 'top'
    })
  } finally {
    isDeleteDialogOpen.value = false
  }
}

// -------------------------- 筛选与分页处理 --------------------------
const applyFilters = () => {
  pagination.value.page = 1
  fetchEmployees()
}

// 筛选条件变化
function handleFilterChange() {
  pagination.value.page = 1
}

// 重置筛选
function resetFilters() {
  filters.value = {
    searchQuery: '',
    division: null,
    department: null,
    team: null,
    isActive: null
  }

  pagination.value.page = 1

  // 添加防抖处理
  clearTimeout(filterTimer)
  filterTimer = setTimeout(() => {
    fetchEmployees()
  }, 300)
}

// 表格排序/分页请求
function onRequest(props) {
  const { page, rowsPerPage, sortBy, descending } = props.pagination

  pagination.value.page = page
  pagination.value.rowsPerPage = rowsPerPage
  pagination.value.sortBy = sortBy
  pagination.value.descending = descending

  handleFilterChange()
  fetchEmployees()
}

// -------------------------- 导入导出功能 --------------------------
// 导入相关状态
const showInitImportDialog = ref(false)
const showNormalImportDialog = ref(false)
const selectedFile = ref(null)
const importLoading = ref(false)
const importErrors = ref([])
const initClearExisting = ref(false)
const importResult = ref(null)

// 1. 模板下载
async function downloadInitTemplate() {
  try {
    const response = await downloadEmployeeTemplate({ template_type: 'init' })
    fileUtils.downloadBlob(response.data, '员工初始化导入模板.xlsx')
  } catch (error) {
    $q.notify({
      color: 'negative',
      message: error.message || '初始化模板下载失败',
      position: 'top'
    })
  }
}

async function downloadNormalTemplate() {
  try {
    const response = await downloadEmployeeTemplate({ type: 'normal' })
    fileUtils.downloadBlob(response.data, '员工普通导入模板.xlsx')
  } catch (error) {
    $q.notify({
      color: 'negative',
      message: error.message || '普通导入模板下载失败',
      position: 'top'
    })
  }
}

// 2. 文件选择处理
function handleFileSelected(files) {
  if (files && files.length > 0) {
    selectedFile.value = files[0]
    importErrors.value = []
    importResult.value = null
  }
}

// 3. 初始化导入确认
async function handleClearConfirm(checked) {
  if (checked) {
    $q.dialog({
      title: '危险操作确认',
      message: '确定要清空所有员工数据吗？此操作将删除所有员工记录，且无法恢复！',
      color: 'negative',
      persistent: true,
      ok: { label: '确认清空', color: 'negative' },
      cancel: { label: '取消', color: 'secondary' }
    }).onOk(() => {
      // 用户确认，保持勾选状态
    }).onCancel(() => {
      initClearExisting.value = false
    })
  }
}

// 4. 导入处理
async function handleImport() {
  if (!selectedFile.value) {
    $q.notify({
      color: 'negative',
      message: '请选择要导入的文件',
      position: 'top'
    })
    return
  }

  try {
    importLoading.value = true

    // 根据当前打开的对话框确定导入类型
    let additionalParams = {}
    if (showInitImportDialog.value && initClearExisting.value) {
      additionalParams.clear_existing = true
    }

    const response = await importEmployees(selectedFile.value, additionalParams)

    if (response.status === 200 || response.status === 201) {
      const result = response.data
      importResult.value = result
      importErrors.value = result.errors || []

      if (result.error_count === 0) {
        $q.notify({
          color: 'positive',
          message: '导入成功',
          position: 'top'
        })
        closeImportDialogs()
        fetchEmployees()
      } else {
        $q.notify({
          color: 'warning',
          message: `导入完成，${result.error_count} 条数据导入失败`,
          position: 'top'
        })
      }
    }
  } catch (error) {
    $q.notify({
      color: 'negative',
      message: error.message || '导入失败',
      position: 'top'
    })
  } finally {
    importLoading.value = false
  }
}

// 打开导入对话框
function openImportDialog(type) {
  if (type === 'init') {
    showInitImportDialog.value = true
    showNormalImportDialog.value = false
  } else {
    showNormalImportDialog.value = true
    showInitImportDialog.value = false
  }

  // 重置状态
  selectedFile.value = null
  importErrors.value = []
  importResult.value = null
}

// 关闭导入对话框
function closeImportDialogs() {
  showInitImportDialog.value = false
  showNormalImportDialog.value = false
  selectedFile.value = null
  importErrors.value = []
  importResult.value = null
}

// 5. 重置导入状态
const resetInitImportState = () => {
  closeImportDialogs()
  selectedFile.value = null
  importErrors.value = []
  importResult.value = null
}

// 5. 导出处理
async function handleExportEmployees(exportType = 'all') {
  try {
    tableLoading.value = true

    // 构建导出参数
    const params = {}

    // 如果是导出筛选结果，则使用当前筛选条件
    if (exportType === 'filtered') {
      // 添加筛选参数到导出请求中
      if (filters.value.searchQuery) {
        params.search = filters.value.searchQuery
      }

      if (filters.value.division) {
        params.division = filters.value.division
      }

      if (filters.value.department) {
        params.department = filters.value.department
      }

      if (filters.value.team) {
        params.team = filters.value.team
      }

      if (filters.value.isActive !== null) {
        params.is_active = filters.value.isActive ? 'True' : 'False'
      }
    }

    const response = await exportEmployees(params)
    const filename = `员工_${format(new Date(), 'yyyyMMddHHmmss')}.xlsx`
    fileUtils.downloadBlob(response.data, filename)

  } catch (error) {
    $q.notify({
      color: 'negative',
      message: error.message || '导出员工失败',
      position: 'top'
    })
  } finally {
    tableLoading.value = false
  }
}

// 6. 下载导入错误详情
function downloadImportErrors() {
  if (importErrors.value.length === 0) return

  // 转换错误数据为Excel格式
  const exportData = importErrors.value.map(err => ({
    '行号': err.row,
    '错误原因': err.error,
    '原始数据': JSON.stringify(err.data)
  }))

  exportExcel(exportData, `员工导入错误详情_${format(new Date(), 'yyyyMMddHHmmss')}.xlsx`)
}

// -------------------------- 页面初始化 --------------------------
onMounted(() => {
  fetchSelectOptions()
  fetchEmployees()
})

onUnmounted(() => {
  if (filterTimer) {
    clearTimeout(filterTimer)
  }
})
</script>

<style scoped>
.text-gray-500 {
  color: var(--q-color-gray-500);
}

.q-uploader__content {
  min-height: 120px !important;
}

.import-error-table {
  font-size: 12px;
}
</style>
