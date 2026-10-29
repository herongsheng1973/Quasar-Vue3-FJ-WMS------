<template>
  <div class="q-pa-md">
    <div class="q-gutter-y-md">
      <q-tabs v-model="tab" class="bg-blue-grey-2" dense align="justify">
        <q-tab class="text-orange" name="divisions" icon="account_balance" label="Divisions" />
        <q-tab class="text-cyan" name="departments" icon="business" label="Departments" />
        <q-tab class="text-red" name="teams" icon="groups" label="Teams" />
        <q-tab class="text-orange" name="positions" icon="work" label="Positions" />
        <q-tab class="text-cyan" name="salaryGrades" icon="payments" label="Sal_Grades" />
        <q-tab class="text-orange" name="cities" icon="location_city" label="Cities" />
        <q-tab class="text-cyan" name="travelling" icon="flight" label="Travelling" />
        <q-tab class="text-red" name="position_history" icon="history" label="Position History" />
        <q-tab class="text-orange" name="salary_history" icon="attach_money" label="Salary History" />
      </q-tabs>
      <q-tab-panels v-model="tab" animated class="bg-white text-black">
        <q-tab-panel name="divisions">
          <divisions-form />
        </q-tab-panel>
        <q-tab-panel name="departments">
          <departments-form />
        </q-tab-panel>
        <q-tab-panel name="teams">
          <teams-form />
        </q-tab-panel>
        <q-tab-panel name="positions">
          <positions-form />
        </q-tab-panel>
        <q-tab-panel name="salaryGrades">
          <salary-grades-form />
        </q-tab-panel>
        <q-tab-panel name="cities">
          <cities-form />
        </q-tab-panel>
        <q-tab-panel name="travelling">
          <travelling-fee-form />
        </q-tab-panel>
        <q-tab-panel name="position_history">
          <position-history-form />
        </q-tab-panel>
        <q-tab-panel name="salary_history">
          <salary-history-form />
        </q-tab-panel>
      </q-tab-panels>
    </div>
  </div>
</template>
<script setup>

import { ref } from 'vue'

const tab = ref('divisions')
import DivisionsForm from 'src/components/DivisionsForm.vue'
import DepartmentsForm from 'src/components/DepartmentsForm.vue'
import TeamsForm from 'src/components/TeamsForm.vue'
import PositionsForm from 'src/components/PositionsForm.vue'
import SalaryGradesForm from 'src/components/SalaryGradesForm.vue'
import CitiesForm from 'src/components/CitiesForm.vue'
import TravellingFeeForm from 'src/components/TravellingFeeForm.vue'
import PositionHistoryForm from 'src/components/PositionHistoryForm.vue'
import SalaryHistoryForm from 'src/components/SalaryHistoryForm.vue'
</script>
