<template>
  <q-page class="q-px-md">
    <!-- 页面标题和操作按钮 -->
    <div class="col-12 flex justify-between items-center mb-6 flex-wrap gap-4">
      <div>
        <h5 class="text-h5 q-ma-none">月度考勤管理</h5>
        <p class="text-grey text-subtitle2">管理员工月度考勤记录</p>
      </div>
      <div class="flex gap-2 flex-wrap">
        <!-- 生成月度考勤按钮 -->
        <q-btn color="primary" label="生成月度考勤" @click="openGenerateDialog" />
        <!-- 考勤导入 -->
        <q-btn-dropdown color="secondary" label="考勤导入" icon="upload">
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
        <!-- 导出考勤 -->
        <q-btn-dropdown color="primary" label="导出考勤" icon="download">
          <q-list>
            <q-item clickable v-close-popup @click="handleExportMonthlyAttendances('all')">
              <q-item-section avatar>
                <q-icon name="file_download" />
              </q-item-section>
              <q-item-section>
                <q-item-label>导出全部</q-item-label>
                <q-item-label caption>导出所有考勤记录</q-item-label>
              </q-item-section>
            </q-item>
            <q-item clickable v-close-popup @click="handleExportMonthlyAttendances('filtered')">
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
          <!-- 员工筛选 -->
          <div class="col-md-2 col-sm-4 col-xs-12">
            <q-select v-model="filters.employee" label="员工" :options="employeeOptions" option-label="employee_name"
              option-value="id" emit-value map-options clearable dense />
          </div>

          <!-- 年份筛选 -->
          <div class="col-md-2 col-sm-4 col-xs-12">
            <q-input v-model.number="filters.year" label="年份" type="number" :min="1900" :max="2100" dense clearable
              @update:model-value="handleFilterChange" />
          </div>

          <!-- 月份筛选 -->
          <div class="col-md-2 col-sm-4 col-xs-12">
            <q-select v-model="filters.month" label="月份" :options="monthOptions" option-label="label"
              option-value="value" emit-value map-options clearable @update:model-value="handleFilterChange" dense />
          </div>

          <div class="col-md-3 col-sm-6 col-xs-12">
            <div class="row q-col-gutter-sm justify-end">
              <div class="col-auto">
                <q-btn label="重置筛选" color="secondary" @click="resetFilters" class="full-width" unelevated />
              </div>
              <div class="col-auto">
                <q-btn label="应用筛选" color="primary" type="submit" class="full-width" unelevated />
              </div>
            </div>
          </div>
        </div>
      </q-form>
    </div>

    <!-- 考勤记录列表 -->
    <div class="col-12 bg-white rounded-borders shadow-sm">
      <q-table :rows="monthlyAttendances" :columns="columns" v-model:pagination="pagination"
        :rows-per-page-options="[10, 20, 30, 50, 100]" :filter="filters" @request="onRequest" row-key="id"
        :loading="tableLoading">
        <!-- 序号显示模板 -->
        <template #body-cell-index="props">
          <q-td :props="props">
            <div>{{ (pagination.page - 1) * pagination.rowsPerPage + props.rowIndex + 1 }}</div>
          </q-td>
        </template>

        <!-- 员工信息 -->
        <template #body-cell-employee="props">
          <q-td :props="props">
            <div>{{ props.row.employee_name }}({{ props.row.employee_wbc }})</div>
          </q-td>
        </template>

        <!-- 时间信息 -->
        <template #body-cell-period="props">
          <q-td :props="props">
            <div>{{ props.row.year }}年{{ props.row.month }}月</div>
          </q-td>
        </template>

        <!-- 各类天数统计 -->
        <template #body-cell-stats="props">
          <q-td :props="props">
            <div class="column">
              <div>出勤: {{ props.row.present_days }}天</div>
              <div>请假: {{ props.row.leave_days }}天</div>
              <div>轮休: {{ props.row.rotation_days }}天</div>
            </div>
          </q-td>
        </template>

        <!-- 工作相关信息 -->
        <template #body-cell-work="props">
          <q-td :props="props">
            <div class="column">
              <div>双倍工资: {{ props.row.double_days }}天</div>
              <div>停工待命: {{ props.row.standby_days }}天</div>
              <div>出勤率: {{ props.row.attendance_rate }}%</div>
            </div>
          </q-td>
        </template>

        <template #body-cell-actions="props">
          <q-td :props="props">
            <q-btn size="sm" color="info" icon="visibility" class="q-mr-1"
              @click="viewMonthlyAttendanceDetail(props.row)" label="查看" />
            <q-btn size="sm" color="accent" icon="edit" @click="editMonthlyAttendance(props.row)" label="编辑" />
            <q-btn size="sm" color="warning" icon="delete" @click="handleDeleteMonthlyAttendance(props.row)"
              label="删除" />
          </q-td>
        </template>

        <template #loading>
          <div class="row items-center justify-center q-pa-md">
            <q-spinner size="40px" color="primary" />
            <span class="q-ml-md text-subtitle1">加载月度考勤记录中...</span>
          </div>
        </template>
      </q-table>
    </div>

    <!-- 查看记录详情弹窗 -->
    <q-dialog v-model="isDetailDialogOpen" persistent>
      <q-card style="width: 600px; max-width: 90vw;">
        <q-card-section>
          <div class="row items-center justify-between">
            <h5 class="text-h5">月度考勤详情</h5>
            <q-btn icon="close" flat round @click="isDetailDialogOpen = false" />
          </div>
        </q-card-section>

        <q-separator />

        <q-card-section class="q-pt-none">
          <div class="row q-mb-sm">
            <div class="col-4 text-subtitle2">员工:</div>
            <div class="col-8">{{ monthlyAttendanceDetail.employee_name }} ({{ monthlyAttendanceDetail.employee_wbc }})
            </div>
          </div>

          <div class="row q-mb-sm">
            <div class="col-4 text-subtitle2">考勤期间:</div>
            <div class="col-8">{{ monthlyAttendanceDetail.year }}年{{ monthlyAttendanceDetail.month }}月</div>
          </div>

          <div class="row q-mb-sm">
            <div class="col-4 text-subtitle2">返岗日期:</div>
            <div class="col-8">{{ monthlyAttendanceDetail.last_return_date ?
              formatDate(monthlyAttendanceDetail.last_return_date) : '-' }}</div>
          </div>

          <div class="row q-mb-sm">
            <div class="col-4 text-subtitle2">出勤天数:</div>
            <div class="col-8">{{ monthlyAttendanceDetail.present_days }} 天</div>
          </div>

          <div class="row q-mb-sm">
            <div class="col-4 text-subtitle2">请假天数:</div>
            <div class="col-8">{{ monthlyAttendanceDetail.leave_days }} 天</div>
          </div>

          <div class="row q-mb-sm">
            <div class="col-4 text-subtitle2">轮休天数:</div>
            <div class="col-8">{{ monthlyAttendanceDetail.rotation_days }} 天</div>
          </div>

          <div class="row q-mb-sm">
            <div class="col-4 text-subtitle2">双倍工资天数:</div>
            <div class="col-8">{{ monthlyAttendanceDetail.double_days }} 天</div>
          </div>

          <div class="row q-mb-sm">
            <div class="col-4 text-subtitle2">停工待命天数:</div>
            <div class="col-8">{{ monthlyAttendanceDetail.standby_days }} 天</div>
          </div>

          <div class="row q-mb-sm">
            <div class="col-4 text-subtitle2">当月总天数:</div>
            <div class="col-8">{{ monthlyAttendanceDetail.total_days }} 天</div>
          </div>

          <div class="row q-mb-sm">
            <div class="col-4 text-subtitle2">总工作天数:</div>
            <div class="col-8">{{ monthlyAttendanceDetail.working_days }} 天</div>
          </div>

          <div class="row q-mb-sm">
            <div class="col-4 text-subtitle2">连续工作天数:</div>
            <div class="col-8">{{ monthlyAttendanceDetail.current_working_days }} 天</div>
          </div>

          <div class="row q-mb-sm">
            <div class="col-4 text-subtitle2">出勤率:</div>
            <div class="col-8">{{ monthlyAttendanceDetail.attendance_rate }}%</div>
          </div>

          <div class="row q-mb-sm">
            <div class="col-4 text-subtitle2">创建时间:</div>
            <div class="col-8">{{ monthlyAttendanceDetail.created_at ? formatDate(monthlyAttendanceDetail.created_at) :
              '-'
            }}</div>
          </div>

          <div class="row q-mb-sm">
            <div class="col-4 text-subtitle2">更新时间:</div>
            <div class="col-8">{{ monthlyAttendanceDetail.updated_at ? formatDate(monthlyAttendanceDetail.updated_at) :
              '-'
            }}</div>
          </div>
          <!-- 在查看详情对话框中添加日历展示区域 -->
          <div class="row q-mt-md">
            <div class="col-12">
              <div class="text-subtitle1 q-mb-sm">月度考勤日历</div>
              <q-card flat bordered class="q-ma-sm">
                <q-card-section class="q-pa-md">
                  <!-- 显示月份和年份 -->
                  <div class="text-h6 q-mb-md text-center">
                    {{ monthlyAttendanceDetail.year }}年{{ monthlyAttendanceDetail.month }}月
                  </div>

                  <!-- 日历表头（星期） -->
                  <div class="row q-mb-sm">
                    <div v-for="weekday in ['日', '一', '二', '三', '四', '五', '六']" :key="weekday"
                      class="col text-center text-weight-bold" style="width: 50px;">
                      {{ weekday }}
                    </div>
                  </div>

                  <!-- 替换原有的日历主体部分 -->
                  <div>
                    <div v-for="(week, weekIndex) in calendarWeeks" :key="weekIndex" class="row">
                      <div v-for="(dayObj, dayIndex) in week" :key="dayIndex"
                        class="col flex items-center justify-center" style="width: 14.28%; height: 50px;">
                        <q-card v-if="dayObj.day" flat bordered
                          class="full-width full-height flex column items-center justify-center"
                          :class="getDayCardClass(dayObj.day)">
                          <div class="text-caption">{{ dayObj.day }}</div>
                          <div class="text-caption q-mt-xs">
                            <q-badge :color="getAttendanceStatusColor(getDayStatus(dayObj.day))"
                              :label="getDayStatusLabel(getDayStatus(dayObj.day))"
                              style="font-size: 8px; padding: 2px 4px;" />
                          </div>
                        </q-card>
                        <q-card v-else flat bordered class="full-width full-height" />
                      </div>
                    </div>
                  </div>

                  <!-- 状态说明 -->
                  <div class="row q-mt-md justify-center">
                    <div class="flex items-center q-mr-md" v-for="status in attendanceStatusList" :key="status.value">
                      <q-badge :color="getAttendanceStatusColor(status.value)" class="q-mr-xs"
                        style="width: 12px; height: 12px;" />
                      <span class="text-caption">{{ status.label }}</span>
                    </div>
                  </div>
                </q-card-section>
              </q-card>
            </div>
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
          <p>确定要删除月度考勤 {{ currentMonthlyAttendance.employee_name }} ({{ currentMonthlyAttendance.employee_wbc }}) 吗？</p>
          <div class="q-mt-sm">
            <q-radio v-model="isSoftDelete" val="true" label="软删除" class="q-mr-md" />
            <q-radio v-model="isSoftDelete" val="false" label="硬删除" />
          </div>
        </q-card-section>
        <q-card-actions align="right">
          <q-btn label="取消" @click="isDeleteDialogOpen = false" color="secondary" />
          <q-btn label="删除" @click="confirmDeleteMonthlyAttendance" color="warning" class="text-blue" />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- 新增/编辑表单对话框 -->
    <q-dialog v-model="isFormDialogOpen">
      <q-card style="width: 600px; max-width: 90vw;">
        <q-card-section>
          <div class="row items-center justify-between">
            <h5 class="text-h5">{{ formMode === 'add' ? '新增月度考勤' : '编辑月度考勤' }}</h5>
            <q-btn icon="close" flat round @click="isFormDialogOpen = false" />
          </div>
        </q-card-section>
        <q-card-section>
          <q-form @submit="handleSubmit">
            <div class="row q-col-gutter-md">
              <!-- 员工选择 -->
              <div class="col-12">
                <q-select v-model="currentMonthlyAttendance.employee" label="员工 *" :options="employeeOptions"
                  option-label="employee_name" option-value="id" map-options emit-value clearable dense outlined
                  :rules="[val => !!val || '请选择员工']" />
              </div>

              <!-- 年份和月份 -->
              <div class="col-6">
                <q-input v-model.number="currentMonthlyAttendance.year" label="年份 *" type="number" :min="1900"
                  :max="2100" dense outlined :rules="[val => !!val || '请输入年份',
                  val => val >= 1900 && val <= 2100 || '年份应在1900-2100之间']" />
              </div>

              <div class="col-6">
                <q-select v-model="currentMonthlyAttendance.month" label="月份 *" :options="monthOptions"
                  option-label="label" option-value="value" map-options emit-value clearable dense outlined
                  :rules="[val => val !== null && val !== undefined || '请选择月份']" />
              </div>

              <!-- 返岗日期 -->
              <div class="col-12">
                <q-input v-model="currentMonthlyAttendance.last_return_date" label="返岗日期" dense outlined
                  mask="####-##-##" :rules="[val => !val || /^\d{4}-\d{2}-\d{2}$/.test(val) || '请输入有效日期']">
                  <template #append>
                    <q-icon name="event" class="cursor-pointer">
                      <q-popup-proxy cover transition-show="scale" transition-hide="scale">
                        <q-date v-model="currentMonthlyAttendance.last_return_date" mask="YYYY-MM-DD">
                          <div class="row items-center justify-end">
                            <q-btn v-close-popup label="关闭" color="primary" flat />
                          </div>
                        </q-date>
                      </q-popup-proxy>
                    </q-icon>
                  </template>
                </q-input>
              </div>

              <!-- 各类天数输入 -->
              <div class="col-6">
                <q-input v-model.number="currentMonthlyAttendance.present_days" label="出勤天数" type="number" :min="0"
                  dense outlined />
              </div>

              <div class="col-6">
                <q-input v-model.number="currentMonthlyAttendance.leave_days" label="请假天数" type="number" :min="0" dense
                  outlined />
              </div>

              <div class="col-6">
                <q-input v-model.number="currentMonthlyAttendance.rotation_days" label="轮休天数" type="number" :min="0"
                  dense outlined />
              </div>

              <div class="col-6">
                <q-input v-model.number="currentMonthlyAttendance.double_days" label="双倍工资天数" type="number" :min="0"
                  dense outlined />
              </div>

              <div class="col-6">
                <q-input v-model.number="currentMonthlyAttendance.standby_days" label="停工待命天数" type="number" :min="0"
                  dense outlined />
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

    <!-- 1. 初始化导入弹窗 -->
    <q-dialog v-model="showInitImportDialog" max-width="700px">
      <q-card>
        <q-card-section class="row items-center justify-between">
          <h5 class="text-h5 text-negative">⚠️ 月度考勤初始化导入</h5>
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
                <li>1. 初始化导入将<span class="font-medium text-negative">覆盖现有月度考勤数据</span>，适用于系统首次上线或全量数据重置</li>
                <li>2. 若勾选"清空现有数据"，将删除所有考勤记录，<span class="font-medium text-negative">操作不可撤销</span></li>
                <li>3. 请确保导入文件包含必要字段（建议先下载模板）</li>
              </ul>
            </div>

            <!-- 模板下载 -->
            <div class="flex justify-between items-center">
              <p class="text-sm">请下载模板并按格式填写数据</p>
              <q-btn label="下载考勤初始化模板" color="secondary" icon="file_download" size="sm" @click="downloadInitTemplate" />
            </div>

            <!-- 文件上传 -->
            <q-uploader label="选择考勤初始化文件（仅支持.xlsx/.xls）" accept=".xlsx, .xls" :max-files="1" @added="handleFileSelected"
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
              <q-checkbox v-model="initClearExisting" label="清空现有月度考勤数据" color="negative"
                @update:model-value="handleClearConfirm" />
            </div>

            <!-- 导入结果/错误展示 -->
            <div v-if="importErrors.length > 0" class="mt-4">
              <h6 class="text-negative text-sm font-medium">导入失败记录（共{{ importErrors.length }}条）</h6>
              <div class="bg-white border border-gray-200 rounded mt-2 max-h-60 overflow-auto">
                <q-table :rows="importErrors" :columns="importErrorColumns" row-key="row" dense hide-header flat />
              </div>
              <q-btn label="下载月度考勤错误详情" color="negative" size="sm" class="mt-2" @click="downloadImportErrors" dense />
            </div>

            <!-- 初始化成功统计 -->
            <div v-if="importResult" class="mt-4 bg-positive/10 p-3 rounded">
              <h6 class="text-positive font-medium">月度考勤初始化导入成功</h6>
              <ul class="text-sm mt-2 space-y-1">
                <li>成功创建月度考勤记录：{{ importResult.attendance_success_count }} 条</li>
                <li>失败月度考勤记录：{{ importResult.error_count }} 条</li>
              </ul>
            </div>
          </div>
        </q-card-section>
        <q-card-actions align="right" class="q-pa-md">
          <q-btn label="取消" color="secondary" @click="resetInitImportState" />
          <q-btn label="开始月度考勤初始化" color="negative" class="ml-2" @click="handleImport"
            :disable="!selectedFile || importLoading" :loading="importLoading" />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- 2. 普通导入弹窗 -->
    <q-dialog v-model="showNormalImportDialog" max-width="700px">
      <q-card>
        <q-card-section class="row items-center justify-between">
          <h5 class="text-h5">月度普通考勤导入</h5>
          <q-btn icon="close" flat round @click="closeImportDialogs" />
        </q-card-section>
        <q-card-section class="q-pa-md">
          <div class="space-y-4">
            <p class="text-sm">月度普通考勤导入仅新增/更新考勤记录，不删除现有数据，适用于日常批量更新</p>
            <div class="flex justify-between items-center">
              <p class="text-sm">请下载模板并按格式填写数据</p>
              <q-btn label="下载普通考勤导入模板" color="secondary" icon="file_download" size="sm"
                @click="downloadNormalTemplate" />
            </div>
            <q-uploader label="选择月度普通考勤导入文件（仅支持.xlsx/.xls）" accept=".xlsx, .xls" :max-files="1"
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
          <q-btn label="开始月度普通考勤导入" color="primary" class="ml-2" @click="handleImport"
            :disable="!selectedFile || importLoading" :loading="importLoading" />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- 生成月度考勤对话框 -->
    <q-dialog v-model="generateDialogVisible" max-width="500px">
      <q-card>
        <q-card-section>
          <div class="row items-center justify-between">
            <h5 class="text-h5">生成月度考勤</h5>
            <q-btn icon="close" flat round @click="generateDialogVisible = false" />
          </div>
        </q-card-section>

        <q-card-section>
          <q-form @submit="handleGenerate">
            <div class="row q-col-gutter-md">
              <div class="col-12">
                <q-input v-model.number="generateParams.year" label="年份 *" type="number" :min="1900" :max="2100" dense
                  outlined :rules="[val => !!val || '请输入年份']" />
              </div>

              <div class="col-12">
                <q-select v-model="generateParams.month" label="月份 *" :options="monthOptions" option-label="label"
                  option-value="value" map-options emit-value clearable dense outlined
                  :rules="[val => val !== null && val !== undefined || '请选择月份']" />
              </div>

              <div class="col-12">
                <q-select v-model="generateParams.employee_ids" label="员工" :options="employeeOptions"
                  option-label="employee_name" option-value="id" map-options emit-value multiple clearable dense
                  outlined use-chips />
              </div>
            </div>

            <q-card-actions align="right" class="q-pt-md">
              <q-btn label="取消" @click="generateDialogVisible = false" color="secondary" />
              <q-btn label="生成" type="submit" color="primary" class="q-ml-sm" />
            </q-card-actions>
          </q-form>
        </q-card-section>
      </q-card>
    </q-dialog>

  </q-page>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useQuasar } from 'quasar'
import { format, parseISO } from 'date-fns'
import { exportExcel } from 'src/utils/excel-utils'

// API导入 - 考勤相关接口
import {
  getMonthlyAttendances,
  getMonthlyAttendanceDetail,
  createMonthlyAttendance,
  updateMonthlyAttendance,
  generateMonthlyAttendance,
  deleteMonthlyAttendance,
  softDeleteMonthlyAttendance,
  getEmployees,
  exportMonthlyAttendances,
  importMonthlyAttendances,
  downloadMonthlyAttendanceTemplate
} from 'src/services/employeeServiceApi'

// 初始化Quasar
const $q = useQuasar()

// -------------------------- 基础状态变量 --------------------------
const monthlyAttendances = ref([])
const tableLoading = ref(false)
const isDetailDialogOpen = ref(false)
const isDeleteDialogOpen = ref(false)
const isFormDialogOpen = ref(false)
const formMode = ref('add')

// -------------------------- 筛选与分页 --------------------------
const filters = ref({
  employee: null,
  year: null,
  month: null
})

const pagination = ref({
  page: 1,
  rowsPerPage: 10,
  sortBy: 'year',
  descending: true,
  rowsNumber: 0
})

// -------------------------- 数据模型 --------------------------
const currentMonthlyAttendance = ref({
  id: null,
  employee: null,
  year: new Date().getFullYear(),
  month: new Date().getMonth() + 1,
  last_return_date: null,
  present_days: 0,
  leave_days: 0,
  rotation_days: 0,
  double_days: 0,
  standby_days: 0
})

const monthlyAttendanceDetail = ref({})

// -------------------------- 下拉选项配置 --------------------------
const employeeOptions = ref([])
const monthOptions = ref([
  { label: '1月', value: 1 },
  { label: '2月', value: 2 },
  { label: '3月', value: 3 },
  { label: '4月', value: 4 },
  { label: '5月', value: 5 },
  { label: '6月', value: 6 },
  { label: '7月', value: 7 },
  { label: '8月', value: 8 },
  { label: '9月', value: 9 },
  { label: '10月', value: 10 },
  { label: '11月', value: 11 },
  { label: '12月', value: 12 }
])

// -------------------------- 删除选项 --------------------------
const isSoftDelete = ref('true')

// -------------------------- 生成月度考勤相关 --------------------------
const generateDialogVisible = ref(false)
const generateParams = ref({
  year: new Date().getFullYear(),
  month: new Date().getMonth() + 1,
  employee_ids: []
})

// -------------------------- 导入相关状态 --------------------------
const showInitImportDialog = ref(false)
const showNormalImportDialog = ref(false)
const selectedFile = ref(null)
const importLoading = ref(false)
const importErrors = ref([])
const initClearExisting = ref(false)
const importResult = ref(null)

// -------------------------- 表格配置 --------------------------
const columns = ref([
  { name: 'index', label: '序号', field: '', align: 'left', sortable: true, width: '80px' },
  { name: 'employee', label: '员工', field: 'employee_name', align: 'left', sortable: true },
  { name: 'period', label: '考勤期间', field: 'period', align: 'left', sortable: true },
  { name: 'stats', label: '基础统计', field: 'stats', align: 'left' },
  { name: 'work', label: '工作统计', field: 'work', align: 'left' },
  { name: 'total_days', label: '当月天数', field: 'total_days', align: 'left', sortable: true },
  { name: 'attendance_rate', label: '出勤率(%)', field: 'attendance_rate', align: 'left', sortable: true },
  { name: 'created_at', label: '创建时间', field: 'created_at', align: 'left', sortable: true, format: formatDate },
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
  return format(parseISO(dateString), 'yyyy-MM-dd HH:mm')
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
  if (filters.value.employee) {
    params.append('employee', filters.value.employee)
  }

  if (filters.value.year) {
    params.append('year', filters.value.year)
  }

  if (filters.value.month) {
    params.append('month', filters.value.month)
  }

  return params
}

// 获取月度考勤列表
const fetchMonthlyAttendances = async () => {
  try {
    tableLoading.value = true
    const params = buildFilterParams()
    const response = await getMonthlyAttendances(params)

    if (response.status === 200) {
      monthlyAttendances.value = response.data.results
      pagination.value.rowsNumber = response.data.count
    }
  } catch (error) {
    $q.notify({
      color: 'negative',
      message: error.message || '获取月度考勤失败',
      position: 'top'
    })
  } finally {
    tableLoading.value = false
  }
}

// 获取员工选项
async function fetchEmployeeOptions() {
  try {
    const response = await getEmployees()
    if (response.status === 200) {
      employeeOptions.value = response.data.results.map(item => ({
        id: item.id,
        employee_name: `${item.employee_name}(${item.wbc})`
      }))
    }
  } catch (error) {
    console.error('获取员工选项失败:', error)
  }
}

// -------------------------- 操作方法 --------------------------
// 打开生成对话框
const openGenerateDialog = () => {
  generateDialogVisible.value = true
  generateParams.value = {
    year: new Date().getFullYear(),
    month: new Date().getMonth() + 1,
    employee_ids: []
  }
}

// 查看详情
const viewMonthlyAttendanceDetail = async (attendance) => {
  isDetailDialogOpen.value = true
  try {
    const response = await getMonthlyAttendanceDetail(attendance.id)
    if (response.status === 200) {
      monthlyAttendanceDetail.value = response.data
    }
  } catch (error) {
    $q.notify({
      color: 'negative',
      message: error.message || '获取月度考勤详情失败',
      position: 'top'
    })
  }
}
// 添加计算属性
const firstDayOfMonth = computed(() => {
  if (!monthlyAttendanceDetail.value.year || !monthlyAttendanceDetail.value.month) return 0
  const date = new Date(monthlyAttendanceDetail.value.year, monthlyAttendanceDetail.value.month - 1, 1)
  return date.getDay()
})
// 获取日期卡片的类名（可用于高亮周末等）
const getDayCardClass = (day) => {
  const date = new Date(monthlyAttendanceDetail.value.year, monthlyAttendanceDetail.value.month - 1, day);
  const isWeekend = date.getDay() === 0 || date.getDay() === 6;
  return isWeekend ? 'bg-grey-2' : '';
}
// 考勤状态列表
const attendanceStatusList = ref([
  { label: '出勤', value: 'P' },
  { label: '请假', value: 'L' },
  { label: '轮休', value: 'R' },
  { label: '停工待命', value: 'S' },
  { label: '双倍工资', value: 'D' },
  { label: '休假返回', value: 'J' }
])

// 获取某天的考勤状态
const getDayStatus = (day) => {
  if (!monthlyAttendanceDetail.value.attendance_detail) return ''
  const detail = monthlyAttendanceDetail.value.attendance_detail.find(d => d.day === day)
  return detail ? detail.status : ''
}

// 获取考勤状态颜色
const getAttendanceStatusColor = (status) => {
  switch (status) {
    case 'P': return 'positive'  // 出勤
    case 'L': return 'warning'   // 请假
    case 'R': return 'info'      // 轮休
    case 'S': return 'negative'  // 停工待命
    case 'D': return 'purple'    // 节假日双倍工资
    case 'J': return 'teal'      // 休假返回
    default: return 'grey'
  }
}

const calendarWeeks = computed(() => {
  if (!monthlyAttendanceDetail.value.year || !monthlyAttendanceDetail.value.month) return []

  const weeks = []
  const firstDay = firstDayOfMonth.value
  const totalDays = monthlyAttendanceDetail.value.total_days
  let week = Array(7).fill(null).map(() => ({ day: null }))

  // 填充月初空白
  for (let i = 0; i < firstDay; i++) {
    week[i] = { day: null }
  }

  // 填充日期
  let day = 1
  for (let i = firstDay; i < 7; i++) {
    week[i] = { day }
    day++
  }
  weeks.push(week)

  // 填充剩余日期
  while (day <= totalDays) {
    week = []
    for (let i = 0; i < 7 && day <= totalDays; i++) {
      week.push({ day: day++ })
    }
    // 用空对象填充一周剩余位置
    while (week.length < 7) {
      week.push({ day: null })
    }
    weeks.push(week)
  }

  return weeks
})

// 获取考勤状态标签
const getDayStatusLabel = (status) => {
  const statusMap = {
    'P': '出勤',
    'L': '请假',
    'R': '轮休',
    'S': '待命',
    'D': '双倍',
    'J': '返岗'
  }
  return statusMap[status] || ''
}
// 编辑月度考勤
const editMonthlyAttendance = async (monthlyAttendance) => {
  formMode.value = 'edit'
  isFormDialogOpen.value = true
  try {
    const response = await getMonthlyAttendanceDetail(monthlyAttendance.id)
    if (response.status === 200) {
      currentMonthlyAttendance.value = {
        id: response.data.id,
        employee: response.data.employee,
        year: response.data.year,
        month: response.data.month,
        last_return_date: response.data.last_return_date,
        present_days: response.data.present_days,
        leave_days: response.data.leave_days,
        rotation_days: response.data.rotation_days,
        double_days: response.data.double_days,
        standby_days: response.data.standby_days
      }
    }
  } catch (error) {
    $q.notify({
      color: 'negative',
      message: error.message || '获取月度考勤详情失败',
      position: 'top'
    })
  }
}

// 删除月度考勤
const handleDeleteMonthlyAttendance = async (attendance) => {
  currentMonthlyAttendance.value.id = attendance.id
  currentMonthlyAttendance.value.employee_name = attendance.employee_name
  isDeleteDialogOpen.value = true
}

// -------------------------- 表单处理 --------------------------
// 表单验证
const validateForm = () => {
  if (!currentMonthlyAttendance.value.employee) {
    $q.notify({
      color: 'negative',
      message: '请选择员工',
      position: 'top'
    })
    return false
  }

  if (!currentMonthlyAttendance.value.year) {
    $q.notify({
      color: 'negative',
      message: '请输入年份',
      position: 'top'
    })
    return false
  }

  if (!currentMonthlyAttendance.value.month) {
    $q.notify({
      color: 'negative',
      message: '请选择月份',
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
      await handleAddMonthlyAttendance()
    } else if (formMode.value === 'edit') {
      await handleEditMonthlyAttendance(currentMonthlyAttendance.value.id)
    }
  } finally {
    isFormDialogOpen.value = false
  }
}

// 添加月度考勤
const handleAddMonthlyAttendance = async () => {
  try {
    const formData = {
      employee: currentMonthlyAttendance.value.employee,
      year: currentMonthlyAttendance.value.year,
      month: currentMonthlyAttendance.value.month,
      last_return_date: currentMonthlyAttendance.value.last_return_date,
      present_days: currentMonthlyAttendance.value.present_days,
      leave_days: currentMonthlyAttendance.value.leave_days,
      rotation_days: currentMonthlyAttendance.value.rotation_days,
      double_days: currentMonthlyAttendance.value.double_days,
      standby_days: currentMonthlyAttendance.value.standby_days
    }

    const response = await createMonthlyAttendance(formData)
    if (response.status === 201) {
      $q.notify({
        color: 'positive',
        message: '添加月度考勤成功',
        position: 'top'
      })
      fetchMonthlyAttendances()
    }
  } catch (error) {
    $q.notify({
      color: 'negative',
      message: error.message || '添加月度考勤失败',
      position: 'top'
    })
  }
}

// 更新月度考勤
const handleEditMonthlyAttendance = async (attendanceId) => {
  try {
    const formData = {
      employee: currentMonthlyAttendance.value.employee,
      year: currentMonthlyAttendance.value.year,
      month: currentMonthlyAttendance.value.month,
      last_return_date: currentMonthlyAttendance.value.last_return_date,
      present_days: currentMonthlyAttendance.value.present_days,
      leave_days: currentMonthlyAttendance.value.leave_days,
      rotation_days: currentMonthlyAttendance.value.rotation_days,
      double_days: currentMonthlyAttendance.value.double_days,
      standby_days: currentMonthlyAttendance.value.standby_days
    }

    const response = await updateMonthlyAttendance(attendanceId, formData)
    if (response.status === 200) {
      $q.notify({
        color: 'positive',
        message: '更新月度考勤成功',
        position: 'top'
      })
      fetchMonthlyAttendances()
    }
  } catch (error) {
    $q.notify({
      color: 'negative',
      message: error.message || '更新月度考勤失败',
      position: 'top'
    })
  }
}

// -------------------------- 删除处理 --------------------------
// 确认删除月度考勤
const confirmDeleteMonthlyAttendance = async () => {
  try {
    const deleteMode = isSoftDelete.value === 'true'
    let response
    if (deleteMode) {
      response = await softDeleteMonthlyAttendance(currentMonthlyAttendance.value.id)
    } else {
      response = await deleteMonthlyAttendance(currentMonthlyAttendance.value.id)
    }
    if (response.status === 204) {
      $q.notify({
        color: 'positive',
        message: deleteMode ? '软删除成功' : '硬删除成功',
        position: 'top'
      })
      fetchMonthlyAttendances()
    }
  } catch (error) {
    $q.notify({
      color: 'negative',
      message: error.message || '删除月度考勤失败',
      position: 'top'
    })
  } finally {
    isDeleteDialogOpen.value = false
  }
}

// -------------------------- 筛选与分页处理 --------------------------
const applyFilters = () => {
  pagination.value.page = 1
  fetchMonthlyAttendances()
}

// 筛选条件变化
function handleFilterChange() {
  pagination.value.page = 1
}

// 重置筛选
function resetFilters() {
  filters.value = {
    employee: null,
    year: null,
    month: null
  }

  pagination.value.page = 1
  fetchMonthlyAttendances()
}

// 表格排序/分页请求
function onRequest(props) {
  const { page, rowsPerPage, sortBy, descending } = props.pagination

  pagination.value.page = page
  pagination.value.rowsPerPage = rowsPerPage
  pagination.value.sortBy = sortBy
  pagination.value.descending = descending

  fetchMonthlyAttendances()
}

// -------------------------- 生成月度考勤处理 --------------------------
// 处理生成月度考勤
const handleGenerate = async () => {
  try {
    await generateMonthlyAttendance(generateParams.value)
    $q.notify({
      color: 'positive',
      message: '月度考勤生成成功',
      position: 'top'
    })

    generateDialogVisible.value = false
    fetchMonthlyAttendances() // 重新加载数据
  } catch (error) {
    $q.notify({
      color: 'negative',
      message: error.message || '生成月度考勤失败',
      position: 'top'
    })
  }
}

// -------------------------- 导入导出功能 --------------------------
// 通用文件下载处理函数
function handleFileDownload(response, filename) {
  const url = window.URL.createObjectURL(new Blob([response.data]))
  const link = document.createElement('a')
  link.href = url
  link.setAttribute('download', filename)
  document.body.appendChild(link)
  link.click()
  link.remove()
  window.URL.revokeObjectURL(url)
}

// 1. 模板下载
async function downloadInitTemplate() {
  try {
    const response = await downloadMonthlyAttendanceTemplate('init')
    handleFileDownload(response, '月度考勤初始化导入模板.xlsx')
  } catch (error) {
    $q.notify({
      color: 'negative',
      message: error.message || '月度考勤初始化模板下载失败',
      position: 'top'
    })
  }
}

async function downloadNormalTemplate() {
  try {
    const response = await downloadMonthlyAttendanceTemplate('normal')
    handleFileDownload(response, '月度考勤普通导入模板.xlsx')
  } catch (error) {
    $q.notify({
      color: 'negative',
      message: error.message || '月度考勤普通导入模板下载失败',
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
      message: '确定要清空所有月度考勤数据吗？此操作将删除所有月度考勤记录，且无法恢复！',
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
    let clearExisting = false
    if (showInitImportDialog.value) {
      clearExisting = initClearExisting.value
    }

    const response = await importMonthlyAttendances(selectedFile.value, clearExisting)

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
        fetchMonthlyAttendances()
      } else {
        downloadImportErrors()
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

// 6. 导出处理
async function handleExportMonthlyAttendances(exportType = 'all') {
  try {
    tableLoading.value = true

    // 构建导出参数
    let params = {}

    // 如果是导出筛选结果，则使用当前筛选条件
    if (exportType === 'filtered') {
      if (filters.value.employee) params.employee = filters.value.employee
      if (filters.value.year) params.year = filters.value.year
      if (filters.value.month) params.month = filters.value.month
    }

    const response = await exportMonthlyAttendances(params)

    // 处理文件下载
    const blob = new Blob([response.data], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `月度考勤_${format(new Date(), 'yyyyMMddHHmmss')}.xlsx`
    document.body.appendChild(a)
    a.click()
    URL.revokeObjectURL(url)
    document.body.removeChild(a)

  } catch (error) {
    $q.notify({
      color: 'negative',
      message: error.message || '导出月度考勤失败',
      position: 'top'
    })
  } finally {
    tableLoading.value = false
  }
}

// 7. 下载导入错误详情
function downloadImportErrors() {
  if (importErrors.value.length === 0) return

  // 转换错误数据为Excel格式
  const exportData = importErrors.value.map(err => ({
    '行号': err.row,
    '错误原因': err.error,
    '原始数据': JSON.stringify(err.data)
  }))

  exportExcel(exportData, `月度考勤导入错误详情_${format(new Date(), 'yyyyMMddHHmmss')}.xlsx`)
}

// -------------------------- 页面初始化 --------------------------
onMounted(() => {
  fetchEmployeeOptions()
  fetchMonthlyAttendances()
})

onUnmounted(() => {
  // 清理定时器
})
</script>
