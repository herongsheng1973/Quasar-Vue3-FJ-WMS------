<template>
  <q-page class="q-pa-md">
    <!-- 页面标题和操作区 -->
    <div class="col-12 flex flex-wrap justify-between items-center mb-4 gap-4">
      <!-- 标题区 -->
      <div>
        <h4 class="text-h4 text-weight-bold text-grey-8 q-mb-xs">媒体管理</h4>
        <p class="text-grey-5 text-sm">管理和组织您的所有图片、视频和音频文件</p>
      </div>

      <!-- 搜索和视图切换 -->
      <div class="col-12 flex-col flex-wrap justify-between items-center gap-4">
        <!-- 搜索框和排序方式选择框 -->
        <div class="flex items-center gap-2">
          <!-- 搜索框 -->
          <q-input v-model="searchQuery" placeholder="搜索媒体文件和文件夹..." outlined dense class="w-full md:w-64 lg:w-80"
            @input="handleSearch">
            <template v-slot:prepend>
              <q-icon name="search" />
            </template>
          </q-input>

          <div class="flex items-center gap-2">
            <!-- 媒体类型筛选 -->
            <q-select v-model="mediaTypeFilter" :options="mediaTypeOptions" label="媒体类型" outlined dense class="w-36"
              @update:model-value="handleTypeFilterChange" />

            <!-- 排序方式选择框 -->
            <q-select v-model="sortBy" :options="sortOptions" label="排序方式" outlined dense class="w-36"
              @update:model-value="handleSortChange" />

            <!-- 视图切换 -->
            <q-toggle v-model="isGridView" color="primary" label="网格视图" @update:model-value="handleViewChange" />
          </div>
        </div>

        <!-- 批量操作按钮组 -->
        <div v-if="selectedMedia.length > 0"
          class="flex items-center justify-center gap-3 py-2 px-4 bg-grey-2 rounded-lg">
          <q-badge color="primary" :label="`已选择 ${selectedMedia.length} 项`" class="mx-1" />
          <q-btn label="批量删除" color="negative" icon="delete" size="sm" @click="confirmBulkDelete"
            :loading="bulkActionLoading" class="mx-1" />
          <q-btn label="移动到分类" color="secondary" icon="folder_move" size="sm" @click="showBulkMoveDialog = true"
            :loading="bulkActionLoading" class="mx-1" />
          <q-btn label="取消选择" color="grey" size="sm" @click="selectedMedia = []" class="mx-1" />
        </div>
      </div>

      <!-- 主按钮组 -->
      <div class="flex flex-wrap gap-2">
        <!-- 上传媒体和新建分类主按钮组 -->
        <q-btn-group>
          <q-btn label="上传媒体" color="primary" icon="cloud_upload"
            class="shadow-md transition-all duration-300 hover:shadow-lg" @click="showUploadDialog = true"
            :loading="uploadLoading" />
          <q-btn label="新建分类" color="secondary" icon="create_new_folder"
            class="shadow-md transition-all duration-300 hover:shadow-lg" @click="showNewCategoryDialog = true"
            :loading="categoryActionLoading" />
        </q-btn-group>
      </div>
    </div>

    <!-- 主内容区 -->
    <div class="row col-12">
      <!-- 左侧分类导航 - 占据2列 -->
      <div class="col-2 q-gutter-md">
        <!-- 分类导航卡片 -->
        <div v-if="!loadingCategories && categories.length > 0">
          <q-card class="shadow-md h-full">
            <q-card-section class="p-0">
              <q-list bordered>
                <q-item clickable active-class="bg-primary/10 text-primary" :active="currentCategory === 'all'"
                  @click="currentCategory = 'all'">
                  <q-item-section avatar>
                    <q-icon name="folder" />
                  </q-item-section>
                  <q-item-section>所有媒体</q-item-section>
                  <q-item-section side>
                    <q-badge color="grey-4" :label="mediaFiles.length" />
                  </q-item-section>
                </q-item>

                <q-item clickable active-class="bg-primary/10 text-primary" :active="currentCategory === 'images'"
                  @click="currentCategory = 'images'">
                  <q-item-section avatar>
                    <q-icon name="image" color="green" />
                  </q-item-section>
                  <q-item-section>图片</q-item-section>
                  <q-item-section side>
                    <q-badge color="grey-4" :label="getMediaTypeCount('image')" />
                  </q-item-section>
                </q-item>

                <q-item clickable active-class="bg-primary/10 text-primary" :active="currentCategory === 'videos'"
                  @click="currentCategory = 'videos'">
                  <q-item-section avatar>
                    <q-icon name="video_library" color="red" />
                  </q-item-section>
                  <q-item-section>视频</q-item-section>
                  <q-item-section side>
                    <q-badge color="grey-4" :label="getMediaTypeCount('video')" />
                  </q-item-section>
                </q-item>

                <q-item clickable active-class="bg-primary/10 text-primary" :active="currentCategory === 'audios'"
                  @click="currentCategory = 'audios'">
                  <q-item-section avatar>
                    <q-icon name="audiotrack" color="purple" />
                  </q-item-section>
                  <q-item-section>音频</q-item-section>
                  <q-item-section side>
                    <q-badge color="grey-4" :label="getMediaTypeCount('audio')" />
                  </q-item-section>
                </q-item>

                <q-separator />

                <q-item v-for="category in categories" :key="category.id" clickable
                  active-class="bg-primary/10 text-primary" :active="currentCategory === category.id"
                  @click="currentCategory = category.id">
                  <q-item-section avatar>
                    <q-icon name="folder" color="blue" />
                  </q-item-section>
                  <q-item-section>
                    <q-item-label>{{ category.name }}</q-item-label>
                    <q-item-label caption>{{ category.description }}</q-item-label>
                  </q-item-section>
                  <q-item-section side>
                    <q-badge color="grey-4" :label="getCategoryMediaCount(category.id)" />
                  </q-item-section>
                </q-item>
              </q-list>
            </q-card-section>
          </q-card>
        </div>

        <!-- 分类加载状态 -->
        <div v-if="loadingCategories">
          <q-card class="shadow-md h-full">
            <q-card-section class="flex justify-center p-6">
              <q-spinner-dots color="primary" size="30px" />
            </q-card-section>
          </q-card>
        </div>

        <!-- 分类空状态 -->
        <div v-if="!loadingCategories && categories.length === 0">
          <q-card class="shadow-md h-full">
            <q-card-section class="p-6 text-center">
              <q-icon name="category" size="48px" color="grey-3" class="mb-4" />
              <p class="text-grey-500 mb-4">暂无分类</p>
              <q-btn label="新建分类" color="secondary" icon="add" size="sm" @click="showNewCategoryDialog = true" />
            </q-card-section>
          </q-card>
        </div>
      </div>

      <!-- 右侧内容区域 - 占据9列 -->
      <div class="col-10 q-gutter-md">
        <!-- 网格视图加载状态 -->
        <div v-if="loadingMedia" class="flex justify-center p-8">
          <q-spinner-dots color="primary" size="50px" />
        </div>

        <!-- 网格视图空状态 -->
        <div v-if="!loadingMedia && filteredAndSortedMedia.length === 0" class="col-12 text-center p-8">
          <q-icon name="movie" size="64px" color="grey-3" class="mb-4" />
          <h5 class="text-grey-500 mb-2">没有找到媒体文件</h5>
          <p class="text-grey-400 mb-6">尝试调整筛选条件或上传新媒体</p>
          <q-btn label="上传媒体" color="primary" icon="cloud_upload" @click="showUploadDialog = true" />
        </div>

        <!-- 优化后的网格视图 -->
        <div v-if="isGridView && !loadingMedia && filteredAndSortedMedia.length > 0" class="row col-12">
          <div v-for="(media) in filteredAndSortedMedia" :key="media.id" class="col-3">
            <!-- 卡片内容 -->
            <q-card flat bordered
              class="col-2 transition-transform duration-200 hover:-translate-y-1 hover:shadow-xl cursor-pointer"
              :class="{ 'ring-2 ring-primary ring-offset-2': selectedMedia.includes(media.id) }"
              @dblclick="previewMedia(media)" tabindex="0" @keydown.enter.prevent="previewMedia(media)">

              <q-card-section class="q-pb-none">
                <div class="w-full aspect-video flex items-center justify-center rounded-lg overflow-hidden"
                  :class="getMediaIconClass(media.file_type)">
                  <!-- 媒体预览 -->
                  <template v-if="isImageType(media.file_type)">
                    <q-img :src="media.file" class="w-full h-full" fit="cover" ratio="16/9" spinner-color="primary" />
                  </template>
                  <template v-if="isVideoType(media.file_type)">
                    <video :ref="el => setVideoRef(el, media.id)" :src="media.file" width="337px" height="200px"
                      controls loop preload="metadata" :poster="media.thumbnail" @play="onVideoPlay(media.id)">
                      您的浏览器不支持视频播放
                    </video>
                  </template>

                  <template v-if="isAudioType(media.file_type)">
                    <div class="w-full h-full flex flex-col items-center justify-center p-4">
                      <q-img v-if="media.cover_image" :src="media.cover_image" :alt="media.title" style="height: 148px;"
                        ratio="16/9" />
                      <q-icon v-else name="audiotrack" size="28px" />
                      <div class="w-full h-full flex items-center gap-3">
                        <audio :src="media.file" controls>
                          您的浏览器不支持音频播放
                        </audio>
                      </div>
                    </div>
                  </template>
                  <template
                    v-if="!isImageType(media.file_type) && !isVideoType(media.file_type) && !isAudioType(media.file_type)">
                    <q-icon :name="getMediaIcon(media.file_type)" size="64px" />
                  </template>
                </div>
              </q-card-section>

              <q-card-section class="q-pt-none q-pb-sm">
                <q-list dense>
                  <!-- 第一行：媒体标题和悬浮菜单 -->
                  <q-item class="q-py-xs">
                    <q-item-section>
                      <div class="inline-block text-truncate max-w-full">
                        {{ media.title }}
                      </div>
                    </q-item-section>
                    <!-- 悬浮菜单 -->
                    <q-item-section side>
                      <div class="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                        <q-btn dense flat round icon="more_vert" size="sm" @click.stop="$q.menu.show = true">
                          <q-menu anchor="top right" self="top right">
                            <q-list dense>
                              <q-item clickable @click="previewMedia(media)" class="q-py-xs">
                                <q-item-section avatar><q-icon name="visibility" size="sm" /></q-item-section>
                                <q-item-section>预览</q-item-section>
                              </q-item>
                              <q-item clickable @click="handleDownloadMedia(media)" class="q-py-xs">
                                <q-item-section avatar><q-icon name="download" size="sm" /></q-item-section>
                                <q-item-section>下载</q-item-section>
                              </q-item>
                              <q-item clickable @click="editMedia(media)" class="q-py-xs">
                                <q-item-section avatar><q-icon name="edit" size="sm" /></q-item-section>
                                <q-item-section>编辑</q-item-section>
                              </q-item>
                              <q-separator />
                              <q-item clickable text-color="negative" @click="confirmDeleteMedia(media)"
                                class="q-py-xs">
                                <q-item-section avatar><q-icon name="delete" size="sm" /></q-item-section>
                                <q-item-section>删除</q-item-section>
                              </q-item>
                            </q-list>
                          </q-menu>
                        </q-btn>
                      </div>
                    </q-item-section>
                  </q-item>

                  <!-- 第二行：媒体信息 -->
                  <q-item class="q-py-none">
                    <q-item-section>
                      <div class="text-xs text-grey-6 truncate">
                        {{ media.category_name || '未分类' }}
                      </div>
                    </q-item-section>
                    <!-- 批量选择框-->
                    <!-- <q-item-section side>
                      <q-checkbox v-model="selectedMedia" :val="media.id" class="absolute top-2 left-2 z-10"
                        @click.stop />
                    </q-item-section> -->
                  </q-item>

                  <!-- 第三行：媒体类型和时长 -->
                  <q-item class="q-py-none">
                    <div class="text-xs text-grey-5 w-full">
                      <span>{{ getMediaTypeText(media.file_type) }}</span>
                      <span class="mx-1">·</span>
                      <span>{{ media.duration ? formatDuration(media.duration) : formatSize(media.file_size) }}</span>
                    </div>
                  </q-item>

                  <!-- 第四行：日期 -->
                  <q-item class="q-py-none">
                    <div class="text-xs text-grey-5 w-full">
                      {{ formatDate(media.created_at) }}
                    </div>
                  </q-item>
                </q-list>
              </q-card-section>
            </q-card>
          </div>
        </div>

        <!-- 列表视图 -->
        <div v-else-if="!isGridView && !loadingMedia && filteredAndSortedMedia.length > 0">
          <q-table :rows="filteredAndSortedMedia" :columns="tableColumns" row-key="id" class="shadow-0" dense
            :loading="loadingMedia" selection="multiple" v-model:selected="selectedMedia">
            <template v-slot:header-selection="scope">
              <q-toggle v-model="scope.selected" />
            </template>
            <template v-slot:body="props">
              <q-tr :props="props" :class="{ 'bg-primary/5': selectedMedia.includes(props.row.id) }">
                <q-td>
                  <q-toggle v-model="props.selected" :val="props.row.id" />
                </q-td>
                <q-td key="icon" class="w-20">
                  <div v-if="isAudioType(props.row.file_type)"
                    class="w-full h-full flex items-center justify-center bg-purple-1">
                    <q-icon name="audiotrack" size="24px" color="purple" />
                  </div>
                  <div v-else-if="isImageType(props.row.file_type)"
                    class="w-full h-full flex items-center justify-center bg-blue-1">
                    <q-icon name="image" size="24px" color="blue" />
                  </div>
                  <div v-else-if="isVideoType(props.row.file_type)"
                    class="w-full h-full flex items-center justify-center bg-red-1">
                    <q-icon name="play_circle" size="24px" color="red" />
                  </div>
                  <div v-else class="w-full h-full flex items-center justify-center bg-grey-1">
                    <q-icon name="file" size="24px" color="grey" />
                  </div>
                </q-td>
                <q-td key="title">
                  <span class="cursor-pointer text-primary hover:underline" @click="previewMedia(props.row)">
                    {{ props.row.title }}
                  </span>
                </q-td>
                <q-td key="category">
                  {{ props.row.category_name || '未分类' }}
                </q-td>
                <q-td key="type">
                  {{ getMediaTypeText(props.row.file_type) }}
                </q-td>
                <q-td key="duration">
                  {{ props.row.duration ? formatDuration(props.row.duration) : formatSize(props.row.file_size) }}
                </q-td>
                <q-td key="created_at">
                  {{ formatDate(props.row.created_at) }}
                </q-td>
                <q-td key="actions">
                  <q-btn dense flat round icon="visibility" @click="previewMedia(props.row)">
                    <q-tooltip>预览</q-tooltip>
                  </q-btn>
                  <q-btn dense flat round icon="download" @click="handleDownloadMedia(props.row)">
                    <q-tooltip>下载</q-tooltip>
                  </q-btn>
                  <q-btn dense flat round icon="edit" @click="editMedia(props.row)">
                    <q-tooltip>编辑</q-tooltip>
                  </q-btn>
                  <q-btn dense flat round icon="delete" color="negative" @click="confirmDeleteMedia(props.row)">
                    <q-tooltip>删除</q-tooltip>
                  </q-btn>
                </q-td>
              </q-tr>
            </template>
            <template v-slot:no-data>
              <div class="flex flex-col items-center justify-center py-10">
                <q-icon name="movie" size="64px" color="grey-3" class="mb-4" />
                <h5 class="text-grey-500 mb-2">没有找到媒体文件</h5>
                <p class="text-grey-400 mb-6">尝试调整筛选条件或上传新媒体</p>
                <q-btn label="上传媒体" color="primary" icon="cloud_upload" @click="showUploadDialog = true" />
              </div>
            </template>
          </q-table>
        </div>
      </div>
    </div>

    <!-- 上传媒体对话框 -->
    <q-dialog v-model="showUploadDialog">
      <q-card style="width: 500px; max-width: 90vw;">
        <q-card-section>

          <div class="row flex flex-col items-center">
            <h5 class="text-h5 q-pr-lg">上传媒体</h5>
            <q-select v-model="uploadForm.media_type" :options="mediaTypes" option-label="label" option-value="value"
              emit-value map-options class="mt-4" />
          </div>
          <!-- 分类选择 -->
          <q-select v-model="uploadForm.category" :options="categories" option-label="name" option-value="id" emit-value
            map-options label="媒体分类" class="mt-4" />

          <!-- 标题输入 -->
          <q-input v-model="uploadForm.title" label="媒体标题*" class="mt-4" placeholder="请输入媒体标题（必填）" />
          <q-input v-model="uploadForm.artist" label="艺术家*" class="mt-4" placeholder="请输入艺术家名称（必填）" />

          <!-- 描述输入 -->
          <q-input v-model="uploadForm.description" label="媒体描述" class="mt-4" placeholder="请输入媒体描述（可选）" type="textarea"
            rows="3" />
          <q-input v-model="uploadForm.album" label="专辑名称" class="mt-4" placeholder="请输入文件路径（可选）" />
          <q-input v-model="uploadForm.era" label="所属年代" class="mt-4" placeholder="请输入所属年代（可选）" />
          <!-- 文件上传 -->
          <q-uploader ref="uploaderRef" label="媒体文件：拖放文件到此处或点击选择文件" :max-files="5" accept="image/*,video/*,audio/*"
            class="mt-4" @added="onLocalFileSelected" />
          <q-uploader ref="uploader1Ref" label="专辑封面：拖放图片文件到此处或点击选择文件" :max-files="5" accept="image/*" class="mt-4"
            @added="onLocalFileSelected" />
        </q-card-section>
        <q-card-actions align="right" class="q-pa-md">
          <q-btn label="取消" color="grey" @click="handleCancelUpload()" />
          <q-btn label="上传" color="primary" @click="handleFileUpload()" :disable="!uploaderRef"
            :loading="uploadLoading" />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- 新建分类对话框 -->
    <q-dialog v-model="showNewCategoryDialog">
      <q-card style="width: 400px; max-width: 90vw;">
        <q-card-section>
          <h5 class="text-h5">新建分类</h5>
          <q-input v-model="categoryForm.name" label="分类名称*" class="mt-4" :rules="[val => !!val || '分类名称不能为空']" />
          <q-input v-model="categoryForm.description" label="分类描述" class="mt-4" />
        </q-card-section>
        <q-card-actions align="right" class="q-pa-md">
          <q-btn label="取消" color="grey" @click="handleCancelCreateCategory()" />
          <q-btn label="创建" color="primary" @click="handleCreateCategory" :disable="!categoryForm.name.trim()"
            :loading="categoryActionLoading" />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- 批量移动对话框 -->
    <q-dialog v-model="showBulkMoveDialog">
      <q-card style="width: 400px; max-width: 90vw;">
        <q-card-section>
          <h5 class="text-h5">批量移动媒体</h5>
          <p class="text-grey-600 mb-4">将 {{ selectedMedia.length }} 个媒体文件移动到以下分类</p>
          <q-select v-model="bulkMoveCategory" :options="categories" option-label="name" option-value="id" emit-value
            map-options label="目标分类*" class="mt-2" />
        </q-card-section>
        <q-card-actions align="right" class="q-pa-md">
          <q-btn label="取消" color="grey" @click="showBulkMoveDialog = false" />
          <q-btn label="确认移动" color="primary" @click="handleBulkMove" :disable="!bulkMoveCategory"
            :loading="bulkActionLoading" />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- 编辑对话框 -->
    <q-dialog v-model="showEditDialog">
      <q-card>
        <q-card-section>
          <h5 class="text-h5">编辑媒体信息</h5>
          <q-input v-model="editedItem.title" label="标题" class="mt-4" @keyup.enter="confirmEdit" />
          <q-input v-model="editedItem.description" label="描述" class="mt-4" type="textarea" rows="3"
            @keyup.enter="confirmEdit" />
          <q-select v-model="editedItem.category" :options="categories" option-label="name" option-value="id" emit-value
            map-options label="分类" class="mt-4" />
        </q-card-section>
        <q-card-actions align="right" class="q-pa-md">
          <q-btn label="取消" color="grey" @click="showEditDialog = false" />
          <q-btn label="确认" color="primary" @click="confirmEdit" :loading="editLoading" />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- 删除确认对话框 -->
    <q-dialog v-model="showDeleteDialog">
      <q-card>
        <q-card-section>
          <div class="row items-center">
            <q-icon name="delete" color="negative" size="24px" class="q-mr-sm" />
            <span class="text-h6">确认删除</span>
          </div>
        </q-card-section>
        <q-card-section v-if="mediaToDelete">
          <p>
            您确定要删除媒体 <strong>{{ mediaToDelete.title }}</strong> 吗？
            此操作不可撤销。
          </p>
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat label="取消" v-close-popup />
          <q-btn color="negative" label="确认删除" @click="handleDeleteConfirmed" :loading="deleteLoading" />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- 批量删除确认对话框 -->
    <q-dialog v-model="showBulkDeleteDialog">
      <q-card>
        <q-card-section>
          <div class="row items-center">
            <q-icon name="delete" color="negative" size="24px" class="q-mr-sm" />
            <span class="text-h6">确认批量删除</span>
          </div>
        </q-card-section>

        <q-card-section>
          <p>
            您确定要删除选中的 <strong>{{ selectedMedia.length }} 个媒体文件</strong> 吗？
            此操作不可撤销。
          </p>
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="取消" v-close-popup />
          <q-btn color="negative" label="确认删除" @click="handleBulkDeleteConfirmed" :loading="bulkActionLoading" />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- 媒体预览对话框 -->
    <q-dialog v-model="previewDialog.show">
      <q-card>
        <q-card-section class="p-0 flex justify-center items-center">
          <!-- 图片预览 -->
          <q-img v-if="isImageType(previewDialog?.fileType)" :src="previewDialog?.fileUrl"
            class="w-full h-[80vh] object-contain" spinner-color="primary" />

          <!-- 视频预览 -->
          <video v-if="isVideoType(previewDialog?.fileType)" :src="previewDialog?.fileUrl" width="60%" height="60%"
            controls preload="metadata">
            您的浏览器不支持视频播放
          </video>

          <!-- 音频预览 -->
          <div v-if="isAudioType(previewDialog?.fileType)"
            class="w-full h-[80vh] flex flex-col items-center justify-center p-8">
            <div class="w-full max-w-md bg-purple-1 rounded-lg p-6 mb-6">
              <q-icon name="audiotrack" size="64px" color="purple" class="mb-4" />
              <h4 class="text-center mb-4">{{ previewDialog?.fileName }}</h4>
              <audio :src="previewDialog?.fileUrl" controls class="w-full">
                您的浏览器不支持音频播放
              </audio>
            </div>
            <div class="text-center text-grey-500">
              <p v-if="previewDialog?.media">文件大小: {{ formatSize(previewDialog?.media.file_size) }}</p>
              <p v-if="previewDialog?.media">上传时间: {{ formatDate(previewDialog?.media.created_at) }}</p>
            </div>
          </div>
        </q-card-section>
        <q-card-actions align="between" class="p-4 border-t">
          <div>
            <h5>{{ previewDialog?.fileName }}</h5>
            <p class="text-sm text-grey-500" v-if="previewDialog?.media">
              {{ getMediaTypeText(previewDialog?.fileType) }}
              <span class="mx-1">·</span>
              {{ previewDialog?.media.duration ? formatDuration(previewDialog?.media.duration) :
                formatSize(previewDialog?.media.file_size) }}
              <span class="mx-1">·</span>
              {{ formatDate(previewDialog?.media.created_at) }}
            </p>
          </div>
          <q-btn-group class="q-ml-md col-gap-2">
            <q-btn label="关闭" color="primary" @click="previewDialog.show = false" />
            <q-btn label="下载" color="primary" @click="handleDownloadMedia(previewDialog?.media)" />
            <q-btn label="编辑" color="secondary" @click="editMedia(previewDialog?.media); previewDialog.show = false" />
          </q-btn-group>
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useQuasar } from 'quasar';
import {
  getCategories,
  getAllMusic,
  getAllVideos,
  createCategory,
  uploadMusic,
  uploadVideo,
  updateMusic,
  deleteMusic,
  bulkMoveMedia
} from 'src/services/mediaServiceApi';
import { useUserStore } from 'src/stores/userStore';
import { format, parseISO } from 'date-fns';

// 添加视频引用管理
const videoRefs = ref({});

// 设置视频引用
const setVideoRef = (el, id) => {
  if (el) {
    videoRefs.value[id] = el;
  }
};

// 当某个视频开始播放时，暂停其他所有视频
const onVideoPlay = (currentVideoId) => {
  // 遍历所有视频引用
  Object.keys(videoRefs.value).forEach(videoId => {
    // 如果不是当前播放的视频且视频元素存在，则暂停它
    if (videoId !== currentVideoId.toString() && videoRefs.value[videoId]) {
      videoRefs.value[videoId].pause();
    }
  });
};


// 本地文件类型处理
function getFileTypeFromFile(file) {
  return file?.type || guessMimeByExtension(file?.name || '');
}

// 通过文件名后缀猜测 MIME 类型
function guessMimeByExtension(filename = '') {
  const cleanFilename = filename.split('?')[0].split('#')[0];
  const ext = (cleanFilename.split('.').pop() || '').toLowerCase();

  const map = {
    // 图片类型
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    gif: 'image/gif',
    webp: 'image/webp',
    bmp: 'image/bmp',
    svg: 'image/svg+xml',
    // 视频类型
    mp4: 'video/mp4',
    avi: 'video/x-msvideo',
    mov: 'video/quicktime',
    mkv: 'video/x-matroska',
    webm: 'video/webm',
    // 音频类型
    mp3: 'audio/mpeg',
    wav: 'audio/wav',
    ogg: 'audio/ogg',
    flac: 'audio/flac',
    aac: 'audio/aac'
  };

  return map[ext] || '';
}

// 从URL获取文件类型
const getFileTypeFromUrl = async (url) => {
  if (!url) return null;
  try {
    const res = await fetch(url, { method: 'HEAD' });
    const ct = res.headers.get('content-type');
    if (ct) return ct.split(';')[0];
  } catch (e) {
    console.log('获取文件类型失败，按扩展名判断:', e.message);
  }
  // 兜底按扩展名判断
  const match = url.split('?')[0].split('/').pop();
  return guessMimeByExtension(match);
}

// 媒体类型判断工具函数
const isImageType = (fileType) => fileType?.startsWith('image/') || false;
const isVideoType = (fileType) => fileType?.startsWith('video/') || false;
const isAudioType = (fileType) => fileType?.startsWith('audio/') || false;

// 格式化文件大小
const formatSize = (size) => {
  if (!size && size !== 0) return '';
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  if (size < 1024 * 1024 * 1024) return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  return `${(size / (1024 * 1024 * 1024)).toFixed(1)} GB`;
};

// 格式化日期
const formatDate = (dateString) => {
  if (!dateString) return '';
  return format(parseISO(dateString), 'yyyy-MM-dd HH:mm');
};

// 格式化媒体时长（秒转时分秒）
const formatDuration = (seconds) => {
  if (!seconds) return '';

  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);

  if (h > 0) {
    return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  } else {
    return `${m}:${s.toString().padStart(2, '0')}`;
  }
};

// 获取媒体类型文本描述
const getMediaTypeText = (fileType) => {
  if (!fileType) return '未知类型';
  if (isImageType(fileType)) return '图片';
  if (isVideoType(fileType)) return '视频';
  if (isAudioType(fileType)) return '音频';
  return '未知类型';
};

// 获取媒体图标
const getMediaIcon = (fileType) => {
  if (!fileType) return 'insert_drive_file';
  if (isImageType(fileType)) return 'image';
  if (isVideoType(fileType)) return 'video_library';
  if (isAudioType(fileType)) return 'audiotrack';
  return 'insert_drive_file';
};

// 获取媒体图标样式类
const getMediaIconClass = (fileType) => {
  if (!fileType) return 'bg-grey-1';
  if (isImageType(fileType)) return 'bg-green-1';
  if (isVideoType(fileType)) return 'bg-red-1';
  if (isAudioType(fileType)) return 'bg-purple-1';
  return 'bg-grey-1';
};

// 组件逻辑
const $q = useQuasar();
const userStore = useUserStore();
const mediaFileTypes = ref({});

// 状态管理
const currentCategory = ref('all');
const categories = ref([]);
const mediaFiles = ref([]);
const showUploadDialog = ref(false);
const showNewCategoryDialog = ref(false);
const showDeleteDialog = ref(false);
const showBulkDeleteDialog = ref(false);
const showBulkMoveDialog = ref(false);
const showEditDialog = ref(false);
const uploadCategory = ref('');
const isGridView = ref(true); // 默认使用网格视图，更适合媒体浏览
const mediaToDelete = ref(null);
const previewDialog = ref({
  show: false,
  fileUrl: '',
  fileName: '',
  fileType: '',
  media: null
});
const selectedMedia = ref([]);
const bulkMoveCategory = ref('');
const mediaTypeFilter = ref('all');

// 加载状态
const loadingCategories = ref(false);
const loadingMedia = ref(false);
const uploadLoading = ref(false);
const categoryActionLoading = ref(false);
const deleteLoading = ref(false);
const editLoading = ref(false);
const bulkActionLoading = ref(false);

// 搜索和排序
const searchQuery = ref('');
const sortBy = ref('modified-desc'); // 默认按最近修改排序
const sortOptions = [
  { label: '名称 (A-Z)', value: 'name-asc' },
  { label: '名称 (Z-A)', value: 'name-desc' },
  { label: '最近上传', value: 'modified-desc' },
  { label: '最早上传', value: 'modified-asc' },
  { label: '大小 (递增)', value: 'size-asc' },
  { label: '大小 (递减)', value: 'size-desc' }
];

// 媒体类型筛选选项
const mediaTypeOptions = [
  { label: '所有类型', value: 'all' },
  { label: '图片', value: 'image' },
  { label: '视频', value: 'video' },
  { label: '音频', value: 'audio' }
];
// 修正 mediaTypes 定义，让它能够正确显示标签
const mediaTypes = [
  { label: '音频', value: 'audio' },
  { label: '视频', value: 'video' },
  { label: '图片', value: 'image' }
];

// 表单数据
const categoryForm = ref({
  name: '',
  description: ''
});

const uploadForm = ref({
  media_type: 'audio',
  title: '',
  description: '',
  category: '',
  artist: '',
  director: '',
  album: '',
  era: '',
  cover_image: '',
  thumbnail: ''
});


const editedItem = ref({
  title: '',
  description: '',
  category: ''
});
const itemToEdit = ref({});

// 引用
const uploaderRef = ref(null);
const uploader1Ref = ref(null);
// 表格列定义
const tableColumns = [
  { name: 'icon', label: '图标', field: '', align: 'left', sortable: false },
  { name: 'title', label: '标题', field: 'title', align: 'left', sortable: true },
  { name: 'category_name', label: '分类', field: 'category_name', align: 'left', sortable: true },
  { name: 'type', label: '类型', field: 'file_type', align: 'left', sortable: true },
  { name: 'duration', label: '时长/大小', field: 'duration', align: 'left', sortable: true },
  { name: 'created_at', label: '上传时间', field: 'created_at', align: 'left', sortable: true },
  { name: 'actions', label: '操作', field: 'actions', align: 'right', sortable: false }
];

// 计算属性 - 筛选和排序后的媒体文件
const filteredAndSortedMedia = computed(() => {
  let result = [...mediaFiles.value];

  // 分类筛选
  if (currentCategory.value === 'images') {
    result = result.filter(media => isImageType(media.file_type));
  } else if (currentCategory.value === 'videos') {
    result = result.filter(media => isVideoType(media.file_type));
  } else if (currentCategory.value === 'audios') {
    result = result.filter(media => isAudioType(media.file_type));
  } else if (currentCategory.value !== 'all') {
    result = result.filter(media => media.category === currentCategory.value);
  }

  // 媒体类型筛选
  if (mediaTypeFilter.value === 'image') {
    result = result.filter(media => isImageType(media.file_type));
  } else if (mediaTypeFilter.value === 'video') {
    result = result.filter(media => isVideoType(media.file_type));
  } else if (mediaTypeFilter.value === 'audio') {
    result = result.filter(media => isAudioType(media.file_type));
  }

  // 搜索筛选
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase();
    result = result.filter(media =>
      media.title.toLowerCase().includes(query) ||
      (media.description && media.description.toLowerCase().includes(query)) ||
      (media.file_name && media.file_name.toLowerCase().includes(query)) ||
      getMediaTypeText(media.file_type).toLowerCase().includes(query)
    );
  }

  // 排序
  switch (sortBy.value) {
    case 'name-asc':
      result.sort((a, b) => a.title.localeCompare(b.title));
      break;
    case 'name-desc':
      result.sort((a, b) => b.title.localeCompare(a.title));
      break;
    case 'modified-desc':
      result.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      break;
    case 'modified-asc':
      result.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
      break;
    case 'size-asc':
      result.sort((a, b) => a.file_size - b.file_size);
      break;
    case 'size-desc':
      result.sort((a, b) => b.file_size - a.file_size);
      break;
  }

  return result;
});

// 辅助方法 - 获取分类媒体数量
const getCategoryMediaCount = (categoryId) => {
  return mediaFiles.value.filter(media => media.category === categoryId).length;
};

// 辅助方法 - 获取媒体类型数量
const getMediaTypeCount = (type) => {
  if (type === 'image') {
    return mediaFiles.value.filter(media => isImageType(media.file_type)).length;
  } else if (type === 'video') {
    return mediaFiles.value.filter(media => isVideoType(media.file_type)).length;
  } else if (type === 'audio') {
    return mediaFiles.value.filter(media => isAudioType(media.file_type)).length;
  }
  return 0;
};

// 通用方法 - 显示通知
const showNotification = (type, message) => {
  $q.notify({
    color: type,
    message: message,
    position: 'top-right',
    timeout: 3000
  });
};

// 方法 - 加载所有分类
const fetchCategories = async () => {
  loadingCategories.value = true;
  try {
    const response = await getCategories();
    categories.value = response.data.results;
  } catch (error) {
    showNotification('negative', '加载分类失败: ' + (error.message || '未知错误'));
  } finally {
    loadingCategories.value = false;
  }
};

// 方法 - 加载所有媒体
const fetchAllMedia = async () => {
  loadingMedia.value = true;
  try {
    const response = await getAllMusic();
    mediaFiles.value = response.data.results;


    const res = await getAllVideos();
    mediaFiles.value = [...mediaFiles.value, ...res.data.results];
    // 预加载媒体类型信息
    for (const media of mediaFiles.value) {
      if (!media.file_type) {
        media.file_type = await getFileTypeFromUrl(media.file);
        mediaFileTypes.value[media.id] = media.file_type;
      }
    }
  } catch (error) {
    showNotification('negative', '加载媒体失败: ' + (error.message || '未知错误'));
  } finally {
    loadingMedia.value = false;
  }
};

// 方法 - 处理搜索
const handleSearch = () => {
  // 搜索逻辑由计算属性自动处理
};

// 方法 - 处理排序变化
const handleSortChange = () => {
  // 排序逻辑由计算属性自动处理
};

// 方法 - 处理视图变化
const handleViewChange = () => {
  // 视图切换由v-model自动处理
};

// 方法 - 处理类型筛选变化
const handleTypeFilterChange = () => {
  // 类型筛选由计算属性自动处理
};

// 方法 - 取消上传
const handleCancelUpload = () => {
  showUploadDialog.value = false;
  uploadForm.value = { title: '', description: '', category: '', artist: '', album: '', era: '' };
  if (uploaderRef.value) {
    uploaderRef.value.reset();
  }
};

// 方法 - 处理文件选择
const onLocalFileSelected = (files) => {
  for (const file of files) {
    const mime = getFileTypeFromFile(file);
    console.log('本地文件 MIME:', mime);
  }
};

// 方法 - 上传媒体



// 在 handleFileUpload 方法中，修正以下代码：
const handleFileUpload = async () => {
  if (!uploadForm.value.category) {
    showNotification('negative', '请先选择分类');
    return;
  }

  const files = uploaderRef.value?.files || [];
  if (!files.length) {
    showNotification('negative', '请先选择文件');
    return;
  }

  if (!uploadForm.value.title) {
    showNotification('negative', '请输入媒体标题');
    return;
  }

  // 根据媒体类型检查必要的字段
  if (uploadForm.value.media_type === 'audio') {
    if (!uploadForm.value.artist) {
      showNotification('negative', '请输入艺术家名称');
      return;
    }
    if (!uploadForm.value.album) {
      showNotification('negative', '请输入专辑名称');
      return;
    }
    if (!uploadForm.value.era) {
      showNotification('negative', '请输入年代');
      return;
    } else if (!uploadForm.value.era.match(/^\d{4}'s$/)) {
      showNotification('negative', "年代格式错误,如1980's");
      return;
    }
  } else if (uploadForm.value.media_type === 'video') {
    if (!uploadForm.value.artist) {
      showNotification('negative', '请输入导演名称');
      return;
    }
  }

  if (!uploadForm.value.category) {
    showNotification('negative', '请选择媒体分类');
    return;
  }

  const userId = userStore.userInfo.id;
  uploadLoading.value = true;
  try {
    for (const file of files) {
      const formData = new FormData();

      // 提取视频/音频时长
      if (file.type.startsWith('video/') || file.type.startsWith('audio/')) {
        const duration = await getMediaDuration(file);
        if (duration) {
          formData.append('duration', Math.floor(duration));
        }
      }

      // 添加通用字段
      if (uploadForm.value.title) {
        formData.append('title', uploadForm.value.title);
      } else {
        const fileName = file.name.substring(0, file.name.lastIndexOf('.'));
        formData.append('title', fileName);
      }

      if (uploadForm.value.description) {
        formData.append('description', uploadForm.value.description);
      }

      formData.append('file', file);
      formData.append('category', uploadForm.value.category);
      formData.append('owner', userId);
      formData.append('file_type', getFileTypeFromFile(file));

      // 根据媒体类型添加特定字段
      if (uploadForm.value.media_type === 'audio') {
        formData.append('artist', uploadForm.value.artist);
        formData.append('album', uploadForm.value.album);
        formData.append('era', uploadForm.value.era);
        if (uploader1Ref.value && uploader1Ref.value.files.length > 0) {
          formData.append('cover_image', uploader1Ref.value.files[0]);
        }
        await uploadMusic(formData);
      } else if (uploadForm.value.media_type === 'video') {
        formData.append('director', uploadForm.value.artist); // 使用artist字段存储导演信息
        if (uploader1Ref.value && uploader1Ref.value.files.length > 0) {
          formData.append('thumbnail', uploader1Ref.value.files[0]);
        }
        await uploadVideo(formData);
      } else if (uploadForm.value.media_type === 'image') {
        showNotification('negative', '暂时不支持图片上传');
      } else {
        showNotification('negative', '请选择媒体类型');
      }
    }

    // 重置上传器
    if (uploaderRef.value) {
      uploaderRef.value.reset();
    }
    if (uploader1Ref.value) {
      uploader1Ref.value.reset();
    }

    // 重置表单但保持media_type选项
    uploadForm.value.title = '';
    uploadForm.value.description = '';
    uploadForm.value.artist = '';
    uploadForm.value.album = '';
    uploadForm.value.era = '';
    uploadForm.value.director = '';
    uploadForm.value.cover_image = '';
    uploadForm.value.thumbnail = '';

    showUploadDialog.value = false;
    fetchAllMedia();
    showNotification('positive', '媒体上传成功');
  } catch (error) {
    console.error('Upload error:', error);
    showNotification('negative', '媒体上传失败: ' + (error.message || '未知错误'));
  } finally {
    uploadCategory.value = '';
    uploadLoading.value = false;
  }
};

// 获取媒体文件时长
const getMediaDuration = (file) => {
  return new Promise((resolve) => {
    const video = document.createElement('video');
    video.preload = 'metadata';

    video.onloadedmetadata = function () {
      window.URL.revokeObjectURL(video.src);
      resolve(video.duration);
    };

    video.onerror = function () {
      resolve(null);
    };

    video.src = URL.createObjectURL(file);
  });
};

// 方法 - 创建分类
const handleCreateCategory = async () => {
  if (!categoryForm.value.name.trim()) return;

  categoryActionLoading.value = true;
  try {
    await createCategory(categoryForm.value);
    showNewCategoryDialog.value = false;
    categoryForm.value = { name: '', description: '' };
    fetchCategories();
    showNotification('positive', '分类创建成功');
  } catch (error) {
    showNotification('negative', '分类创建失败: ' + (error.message || '未知错误'));
  } finally {
    categoryActionLoading.value = false;
  }
};

// 方法 - 取消创建分类
const handleCancelCreateCategory = () => {
  showNewCategoryDialog.value = false;
  categoryForm.value = { name: '', description: '' };
};

// 方法 - 确认删除媒体
const confirmDeleteMedia = (media) => {
  mediaToDelete.value = media;
  showDeleteDialog.value = true;
};

// 方法 - 处理删除确认
const handleDeleteConfirmed = async () => {
  if (!mediaToDelete.value) return;

  deleteLoading.value = true;
  try {
    await deleteMusic(mediaToDelete.value.id);
    mediaFiles.value = mediaFiles.value.filter(m => m.id !== mediaToDelete.value.id);
    showNotification('positive', '音乐删除成功');
  } catch (error) {
    showNotification('negative', '音乐删除失败: ' + (error.message || '未知错误'));
  } finally {
    showDeleteDialog.value = false;
    mediaToDelete.value = null;
    deleteLoading.value = false;
  }
};

// 方法 - 确认批量删除
const confirmBulkDelete = () => {
  if (selectedMedia.value.length > 0) {
    showBulkDeleteDialog.value = true;
  }
};

// 方法 - 处理批量删除确认
const handleBulkDeleteConfirmed = async () => {
  if (selectedMedia.value.length === 0) return;

  bulkActionLoading.value = true;
  try {
    for (const id of selectedMedia.value) {
      await deleteMusic(id);
    }
    mediaFiles.value = mediaFiles.value.filter(m => !selectedMedia.value.includes(m.id));
    selectedMedia.value = [];
    showBulkDeleteDialog.value = false;
    showNotification('positive', '批量删除成功');
  } catch (error) {
    showNotification('negative', '批量删除失败: ' + (error.message || '未知错误'));
  } finally {
    bulkActionLoading.value = false;
  }
};

// 方法 - 处理批量移动
const handleBulkMove = async () => {
  if (!bulkMoveCategory.value || selectedMedia.value.length === 0) return;

  bulkActionLoading.value = true;
  try {
    await bulkMoveMedia({
      media_ids: selectedMedia.value,
      category_id: bulkMoveCategory.value
    });

    // 更新本地数据
    for (const media of mediaFiles.value) {
      if (selectedMedia.value.includes(media.id)) {
        media.category = bulkMoveCategory.value;
        // 更新分类名称
        const category = categories.value.find(c => c.id === bulkMoveCategory.value);
        if (category) {
          media.category_name = category.name;
        }
      }
    }

    selectedMedia.value = [];
    showBulkMoveDialog.value = false;
    showNotification('positive', '批量移动成功');
  } catch (error) {
    showNotification('negative', '批量移动失败: ' + (error.message || '未知错误'));
  } finally {
    bulkActionLoading.value = false;
  }
};

// 方法 - 编辑媒体
const editMedia = (media) => {
  itemToEdit.value = media;
  editedItem.value = {
    title: media.title,
    description: media.description || '',
    category: media.category
  };
  showEditDialog.value = true;
};

// 方法 - 确认编辑
const confirmEdit = async () => {
  if (!itemToEdit.value || !editedItem.value.title.trim()) return;

  editLoading.value = true;
  try {
    await updateMusic(itemToEdit.value.id, {
      title: editedItem.value.title.trim(),
      description: editedItem.value.description.trim(),
      category: editedItem.value.category
    });

    const index = mediaFiles.value.findIndex(m => m.id === itemToEdit.value.id);
    if (index !== -1) {
      mediaFiles.value[index].title = editedItem.value.title.trim();
      mediaFiles.value[index].description = editedItem.value.description.trim();
      mediaFiles.value[index].category = editedItem.value.category;

      // 更新分类名称
      const category = categories.value.find(c => c.id === editedItem.value.category);
      if (category) {
        mediaFiles.value[index].category_name = category.name;
      }

      mediaFiles.value = [...mediaFiles.value]; // 触发更新
    }

    showEditDialog.value = false;
    showNotification('positive', '媒体信息更新成功');
  } catch (error) {
    showNotification('negative', '媒体信息更新失败: ' + (error.message || '未知错误'));
  } finally {
    editLoading.value = false;
    itemToEdit.value = null;
  }
};

// 方法 - 预览媒体
const previewMedia = async (media) => {
  if (!media) return;

  // 确保 previewDialog 对象存在
  if (!previewDialog.value) {
    previewDialog.value = {
      show: false,
      fileUrl: '',
      fileName: '',
      fileType: '',
      media: null
    };
  }

  previewDialog.value.media = media;
  previewDialog.value.fileUrl = media.file;
  previewDialog.value.fileName = media.title;

  // 获取文件类型
  let fileType = mediaFileTypes.value[media.id] || media.file_type;
  if (!fileType) {
    fileType = await getFileTypeFromUrl(media.file);
    if (fileType) {
      mediaFileTypes.value[media.id] = fileType;
    }
  }
  previewDialog.value.fileType = fileType;

  previewDialog.value.show = true;
};
// 方法 - 下载媒体
const handleDownloadMedia = async (media) => {
  if (!media || !media.file) {
    showNotification('negative', '文件链接不存在');
    return;
  }

  try {
    const response = await fetch(media.file);
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = media.file_name || media.title;
    document.body.appendChild(a);
    a.click();

    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
    showNotification('positive', '下载已开始');
  } catch (error) {
    showNotification('negative', '下载失败: ' + (error.message || '未知错误'));
  }
};

// 页面加载时获取数据
onMounted(() => {
  fetchCategories();
  fetchAllMedia();
});

// 组件卸载时清理视频引用
onUnmounted(() => {
  videoRefs.value = {};
});
</script>
