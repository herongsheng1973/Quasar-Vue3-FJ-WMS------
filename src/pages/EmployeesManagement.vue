<template>
  <div class="q-pa-md">
    <div class="q-gutter-y-md">
      <q-tabs v-model="tab" class="bg-blue-grey-2" dense align="justify">
        <q-tab class="text-orange" name="employees" icon="account_balance" label="Employees" />
        <q-tab class="text-cyan" name="attendance" icon="calendar" label="Attendance" />
        <q-tab class="text-red" name="monthly_attendance" icon="calendar_month" label="Monthly Attendance" />
        <q-tab class="text-orange" name="salary" icon="attach_money" label="Salary" />
        <q-tab class="text-cyan" name="travelling_fee" icon="flight_takeoff" label="Travelling Fee" />
        <q-tab class="text-cyan" name="communication" icon="email" label="Communication" />
        <q-tab class="text-cyan" name="salary_info" icon="info" label="Salary Info" />
      </q-tabs>
      <q-tab-panels v-model="tab" animated class="bg-white text-black">
        <q-tab-panel name="employees">
          <employees-form />
        </q-tab-panel>
        <q-tab-panel name="attendance">
          <attendance-form />
        </q-tab-panel>
        <q-tab-panel name="monthly_attendance">
          <monthly-attendance-form />
        </q-tab-panel>
        <q-tab-panel name="salary">
          <salary-form />
        </q-tab-panel>
        <q-tab-panel name="communication">
          <communication-form />
        </q-tab-panel>
        <q-tab-panel name="travelling_fee">
          <travelling-fee-form />
        </q-tab-panel>
        <q-tab-panel name="salary_info">
          <salary-info-form />
        </q-tab-panel>
      </q-tab-panels>
    </div>
  </div>
</template>
<script setup>
import { ref } from 'vue'

const tab = ref('employees')
import EmployeesForm from 'src/components/EmployeesForm.vue'
import AttendanceForm from 'src/components/AttendanceForm.vue'
import MonthlyAttendanceForm from 'src/components/MonthlyAttendanceForm.vue'
import SalaryForm from 'src/components/SalaryForm.vue'
import CommunicationForm from 'src/components/CommunicationForm.vue'
import TravellingFeeForm from 'src/components/TravellingFeeForm.vue'
import SalaryInfoForm from 'src/components/SalaryInfoForm.vue'
</script>
