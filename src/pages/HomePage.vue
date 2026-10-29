<template>
  <!-- 主页面容器 -->
  <q-page class="welcome-page flex flex-col justify-center">
    <!-- 背景装饰 -->
    <div class="absolute inset-0 z-0">
      <div class="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl"></div>
      <div class="absolute bottom-1/3 right-1/4 w-80 h-80 bg-secondary/10 rounded-full blur-3xl"></div>
    </div>

    <!-- 顶部导航栏 -->

    <q-toolbar class="row mx-auto px-4">
      <!-- 品牌标识 -->
      <q-toolbar-title class="flex items-center gap-2">
        <q-avatar rounded="full" color="primary" text-color="white">
          <q-icon name="grid_on" size="20px" />
        </q-avatar>
        <span class="text-h4 font-bold text-grey-8">FJWMS电子库房管理</span>
        <q-badge color="primary" label="全新上线 v1.0" class="px-4 py-1 text-xs" />
      </q-toolbar-title>

      <q-space />

      <!-- 导航链接 -->
      <div class="hidden md:flex items-center gap-6">
        <a href="#features" @click.prevent="scrollToSection('features')"
          class="text-grey-7 hover:text-primary transition-colors text-sm cursor-pointer">功能</a>
        <a href="#about" @click.prevent="scrollToSection('about')"
          class="text-grey-7 hover:text-primary transition-colors text-sm cursor-pointer">关于</a>
        <a href="#faq" @click.prevent="scrollToSection('faq')"
          class="text-grey-7 hover:text-primary transition-colors text-sm cursor-pointer">帮助</a>
      </div>

      <!-- 用户操作 -->
      <q-btn-group gap-2>
        <q-btn label="登录" flat text-color="primary" class="hidden sm:flex" @click="$router.push('/login')" />
        <q-btn label="注册" color="primary" rounded-full class="shadow-md hover:shadow-lg transition-all"
          @click="$router.push('/register')" />
        <q-btn icon="menu" flat class="md:hidden" @click="showMobileMenu = !showMobileMenu" />
      </q-btn-group>
    </q-toolbar>


    <!-- 移动端菜单 -->
    <q-drawer v-model="showMobileMenu" side="right" behavior="overlay" class="z-20">
      <q-list class="py-4">
        <q-item clickable @click="$router.push('/login')">
          <q-item-section>登录</q-item-section>
        </q-item>
        <q-item clickable @click="$router.push('/register')">
          <q-item-section>注册</q-item-section>
        </q-item>
        <q-separator />
        <q-item clickable @click="scrollToSection('features')">
          <q-item-section>功能</q-item-section>
        </q-item>
        <q-item clickable @click="scrollToSection('about')">
          <q-item-section>关于</q-item-section>
        </q-item>
        <q-item clickable @click="scrollToSection('faq')">
          <q-item-section>帮助</q-item-section>
        </q-item>
      </q-list>
    </q-drawer>

    <!-- 主内容区 -->
    <main class="flex-1 container mx-auto px-4 py-12 md:py-20 z-10 relative">
      <!-- 英雄区 -->
      <section class="flex flex-col md:flex-row items-center gap-12 mb-20">
        <!-- 文本内容 -->
        <div class="w-full md:w-1/2 space-y-6 text-center md:text-left">

          <h1 class="text-h4 font-bold text-grey-9 leading-tight">
            高效管理你的<br>
            <span class="text-primary">数字资源资产</span>
          </h1>
          <p class="text-[clamp(1rem,2vw,1.15rem)] text-grey-6 max-w-lg mx-auto md:mx-0">
            NovaManager 提供一站式文档、图片、音视频管理解决方案，支持智能分类、快速检索与多端同步，让资源管理更简单。
          </p>

          <!-- 行动按钮组 -->
          <div class="flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
            <q-btn label="立即体验" color="primary" icon-right="arrow_forward" rounded-full
              class="shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
              @click="$router.push('/dashboard')" />
            <q-btn label="观看演示" color="secondary" icon-left="play_circle" rounded-full
              class="shadow-md hover:shadow-lg transition-all duration-300" @click="showDemo = true" />
          </div>
          <!-- 视觉焦点 -->
          <div class="w-full md:w-1/2">
            <q-card class="rounded-2xl shadow-2xl animate-fadeIn" style="animation-delay: 300ms">
              <q-card-section class="flex flex-col items-center">
                <q-img src="https://picsum.photos/id/239/800/600" ratio="1" class="object-contain">
                  <div class="absolute to-transparent flex flex-col justify-end p-6">
                    <q-badge color="white" text-color="black" class="self-start mb-3">界面预览</q-badge>
                    <h6 class="text-white text-h6 font-semibold">直观的资源管理界面</h6>
                    <p class="text-white/80 text-sm mt-1">支持网格/列表双视图切换</p>
                  </div>
                </q-img>
              </q-card-section>

              <!-- 功能标签 -->
              <q-card-section class="p-4 bg-white">
                <div class="flex flex-wrap gap-2">
                  <q-chip label="文档管理" size="sm" color="primary/10" text-color="primary" />
                  <q-chip label="媒体预览" size="sm" color="secondary/10" text-color="secondary" />
                  <q-chip label="智能搜索" size="sm" color="accent/10" text-color="accent" />
                  <q-chip label="多端同步" size="sm" color="grey-1" text-color="grey-7" />
                </div>
              </q-card-section>
            </q-card>
          </div>
          <!-- 信任标识 -->
          <div class="flex flex-col items-center md:items-start gap-3 mt-8">
            <p class="text-sm text-grey-5">已被 5000+ 企业采用</p>
            <div class="flex items-center gap-6 opacity-70">
              <q-icon name="business" size="24px" />
              <q-icon name="school" size="24px" />
              <q-icon name="account_balance" size="24px" />
              <q-icon name="local_hospital" size="24px" />
            </div>
          </div>
        </div>
      </section>

      <!-- 功能亮点区 -->
      <section id="features" class="mb-20">
        <div class="text-center mb-12">
          <h2 class="text-[clamp(1.5rem,3vw,2.5rem)] font-bold text-grey-8">核心功能</h2>
          <p class="text-grey-6 max-w-2xl mx-auto mt-3">专为效率设计的资源管理工具，满足个人与企业的多样化需求</p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <!-- 功能卡片 1 -->
          <q-card class="hover:shadow-lg transition-all duration-300 border-none">
            <q-card-section class="p-6">
              <q-avatar rounded="full" color="primary/10" text-color="primary" class="mb-4">
                <q-icon name="cloud_upload" size="24px" />
              </q-avatar>
              <h3 class="text-xl font-semibold mb-2">多格式上传</h3>
              <p class="text-grey-6">支持文档、图片、音视频等20+格式文件，单次可上传多个文件</p>
            </q-card-section>
          </q-card>

          <!-- 功能卡片 2 -->
          <q-card class="hover:shadow-lg transition-all duration-300 border-none">
            <q-card-section class="p-6">
              <q-avatar rounded="full" color="secondary/10" text-color="secondary" class="mb-4">
                <q-icon name="category" size="24px" />
              </q-avatar>
              <h3 class="text-xl font-semibold mb-2">智能分类</h3>
              <p class="text-grey-6">自动按文件类型分类，支持自定义标签与多级文件夹管理</p>
            </q-card-section>
          </q-card>

          <!-- 功能卡片 3 -->
          <q-card class="hover:shadow-lg transition-all duration-300 border-none">
            <q-card-section class="p-6">
              <q-avatar rounded="full" color="accent/10" text-color="accent" class="mb-4">
                <q-icon name="search" size="24px" />
              </q-avatar>
              <h3 class="text-xl font-semibold mb-2">快速检索</h3>
              <p class="text-grey-6">基于名称、内容、标签的多维度搜索，支持模糊匹配</p>
            </q-card-section>
          </q-card>

          <!-- 功能卡片 4 -->
          <q-card class="hover:shadow-lg transition-all duration-300 border-none">
            <q-card-section class="p-6">
              <q-avatar rounded="full" color="green/10" text-color="green" class="mb-4">
                <q-icon name="visibility" size="24px" />
              </q-avatar>
              <h3 class="text-xl font-semibold mb-2">在线预览</h3>
              <p class="text-grey-6">无需下载即可预览文档、图片、音视频，支持缩放与旋转</p>
            </q-card-section>
          </q-card>

          <!-- 功能卡片 5 -->
          <q-card class="hover:shadow-lg transition-all duration-300 border-none">
            <q-card-section class="p-6">
              <q-avatar rounded="full" color="orange/10" text-color="orange" class="mb-4">
                <q-icon name="share" size="24px" />
              </q-avatar>
              <h3 class="text-xl font-semibold mb-2">便捷分享</h3>
              <p class="text-grey-6">生成临时分享链接，支持设置访问权限与有效期</p>
            </q-card-section>
          </q-card>

          <!-- 功能卡片 6 -->
          <q-card class="hover:shadow-lg transition-all duration-300 border-none">
            <q-card-section class="p-6">
              <q-avatar rounded="full" color="red/10" text-color="red" class="mb-4">
                <q-icon name="lock" size="24px" />
              </q-avatar>
              <h3 class="text-xl font-semibold mb-2">安全存储</h3>
              <p class="text-grey-6">文件加密存储，支持版本回溯与回收站功能，防止误删</p>
            </q-card-section>
          </q-card>
        </div>
      </section>

      <!-- 关于我们区 -->
      <section id="about" class="mb-20">
        <div class="text-center mb-12">
          <h2 class="text-[clamp(1.5rem,3vw,2.5rem)] font-bold text-grey-8">关于我们</h2>
          <p class="text-grey-6 max-w-2xl mx-auto mt-3">专注于提供高效、安全的数字资产管理解决方案</p>
        </div>

        <q-card class="rounded-2xl shadow-lg">
          <q-card-section class="p-8">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
              <div>
                <h3 class="text-2xl font-bold text-grey-8 mb-4">为什么选择 NovaManager？</h3>
                <p class="text-grey-6 mb-4">
                  我们致力于为企业和个人用户提供最先进的数字资产管理工具。凭借创新的技术和用户友好的设计理念，
                  NovaManager 已成为数千家企业的首选资源管理平台。
                </p>
                <ul class="space-y-2">
                  <li class="flex items-start gap-2">
                    <q-icon name="check_circle" color="primary" class="mt-1" />
                    <span class="text-grey-7">业界领先的AI智能分类技术</span>
                  </li>
                  <li class="flex items-start gap-2">
                    <q-icon name="check_circle" color="primary" class="mt-1" />
                    <span class="text-grey-7">银行级别的数据安全保障</span>
                  </li>
                  <li class="flex items-start gap-2">
                    <q-icon name="check_circle" color="primary" class="mt-1" />
                    <span class="text-grey-7">跨平台无缝同步体验</span>
                  </li>
                </ul>
              </div>
              <div class="flex justify-center">
                <q-img src="https://picsum.photos/id/106/600/400" alt="关于我们" class="rounded-xl shadow-md" />
              </div>
            </div>
          </q-card-section>
        </q-card>
      </section>

      <!-- 常见问题区 -->
      <section id="faq" class="mb-20">
        <div class="text-center mb-12">
          <h2 class="text-[clamp(1.5rem,3vw,2.5rem)] font-bold text-grey-8">常见问题</h2>
          <p class="text-grey-6 max-w-2xl mx-auto mt-3">解答您在使用过程中可能遇到的问题</p>
        </div>

        <div class="max-w-3xl mx-auto">
          <q-expansion-item label="NovaManager 支持哪些文件格式？" header-class="text-lg font-medium text-grey-8"
            expand-icon-color="primary" class="mb-4">
            <q-card>
              <q-card-section class="text-grey-6">
                我们支持超过20种常见文件格式，包括文档（DOCX、PDF、TXT）、图片（JPG、PNG、GIF）、
                音频（MP3、WAV）、视频（MP4、AVI）等。新格式持续添加中。
              </q-card-section>
            </q-card>
          </q-expansion-item>

          <q-expansion-item label="文件存储是否安全？" header-class="text-lg font-medium text-grey-8" expand-icon-color="primary"
            class="mb-4">
            <q-card>
              <q-card-section class="text-grey-6">
                所有文件均采用AES-256加密存储，并通过SSL/TLS协议传输。我们定期进行安全审计，
                并提供版本控制和回收站功能，确保您的数据万无一失。
              </q-card-section>
            </q-card>
          </q-expansion-item>

          <q-expansion-item label="如何升级到高级账户？" header-class="text-lg font-medium text-grey-8"
            expand-icon-color="primary" class="mb-4">
            <q-card>
              <q-card-section class="text-grey-6">
                登录后进入账户设置页面，选择"订阅计划"即可查看所有套餐并完成升级。
                高级账户享有更大存储空间、更快上传速度和专属客服支持。
              </q-card-section>
            </q-card>
          </q-expansion-item>
        </div>
      </section>

      <!-- 行动召唤区 -->
      <section class="bg-gradient-to-r from-primary to-secondary rounded-3xl p-8 md:p-12 text-white shadow-xl">
        <div class="flex flex-col md:flex-row items-center justify-between gap-8">
          <div class="max-w-2xl">
            <h2 class="text-[clamp(1.5rem,3vw,2.5rem)] font-bold">开始你的高效资源管理之旅</h2>
            <p class="mt-3 text-white/90">注册即可获得 2GB 免费存储空间，升级会员享更多特权</p>
          </div>
          <div class="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
            <q-btn label="免费注册" color="white" text-color="primary" rounded-full
              class="shadow-lg hover:shadow-xl transition-all" @click="$router.push('/register')" />
            <q-btn label="了解会员" color="transparent" text-color="white" bordered rounded-full
              class="hover:bg-white/10 transition-all" @click="$router.push('/pricing')" />
          </div>
        </div>
      </section>
      <!-- 页脚 -->
      <section class="bg-grey-1 py-8">
        <div class="container mx-auto px-4 py-6" style="height: 200px; width: 100%;">
          <div class="grid grid-cols-1 md:grid-cols-4 gap-6">
            <!-- 品牌信息 -->
            <div>
              <div class="flex items-center gap-2 mb-3">
                <q-avatar rounded="full" color="primary" text-color="white" size="sm">
                  <q-icon name="grid_on" size="16px" />
                </q-avatar>
                <span class="text-lg font-bold text-grey-8">NovaManager</span>
              </div>
              <p class="text-xs text-grey-6 mb-3">高效的数字资源管理平台，让每一份资产都井井有条</p>
              <div class="flex gap-2">
                <q-btn icon="facebook" flat text-color="grey-6" size="xs" />
                <q-btn icon="twitter" flat text-color="grey-6" size="xs" />
                <q-btn icon="linkedin" flat text-color="grey-6" size="xs" />
                <q-btn icon="github" flat text-color="grey-6" size="xs" />
              </div>
            </div>

            <!-- 产品链接 -->
            <div>
              <h4 class="font-semibold text-grey-8 mb-3 text-sm">产品</h4>
              <ul class="space-y-1.5">
                <li><a href="#" @click.prevent="scrollToSection('features')"
                    class="text-xs text-grey-6 hover:text-primary cursor-pointer">功能</a></li>
                <li><a href="/pricing" class="text-xs text-grey-6 hover:text-primary">价格</a></li>
                <li><a href="/updates" class="text-xs text-grey-6 hover:text-primary">更新日志</a></li>
                <li><a href="/roadmap" class="text-xs text-grey-6 hover:text-primary">开发路线</a></li>
              </ul>
            </div>

            <!-- 支持链接 -->
            <div>
              <h4 class="font-semibold text-grey-8 mb-3 text-sm">支持</h4>
              <ul class="space-y-1.5">
                <li><a href="/help" class="text-xs text-grey-6 hover:text-primary">帮助中心</a></li>
                <li><a href="/docs" class="text-xs text-grey-6 hover:text-primary">文档</a></li>
                <li><a href="#" @click.prevent="scrollToSection('faq')"
                    class="text-xs text-grey-6 hover:text-primary cursor-pointer">常见问题</a></li>
                <li><a href="/contact" class="text-xs text-grey-6 hover:text-primary">联系我们</a></li>
              </ul>
            </div>

            <!-- 公司链接 -->
            <div>
              <h4 class="font-semibold text-grey-8 mb-3 text-sm">公司</h4>
              <ul class="space-y-1.5">
                <li><a href="#" @click.prevent="scrollToSection('about')"
                    class="text-xs text-grey-6 hover:text-primary cursor-pointer">关于我们</a></li>
                <li><a href="/careers" class="text-xs text-grey-6 hover:text-primary">招贤纳士</a></li>
                <li><a href="/privacy" class="text-xs text-grey-6 hover:text-primary">隐私政策</a></li>
                <li><a href="/terms" class="text-xs text-grey-6 hover:text-primary">服务条款</a></li>
              </ul>
            </div>
          </div>

          <div class="border-t border-grey-200 mt-6 pt-4 flex flex-col md:flex-row justify-between items-center">
            <p class="text-xs text-grey-5">© 2025 NovaManager. 保留所有权利</p>
            <div class="flex gap-3 mt-3 md:mt-0">
              <a href="/privacy" class="text-xs text-grey-5 hover:text-primary">隐私政策</a>
              <a href="/terms" class="text-xs text-grey-5 hover:text-primary">服务条款</a>
              <a href="/cookies" class="text-xs text-grey-5 hover:text-primary">Cookie 设置</a>
            </div>
          </div>
        </div>
      </section>
    </main>



    <!-- 演示视频对话框 -->
    <q-dialog v-model="showDemo" maximized>
      <q-card class="bg-black/95 text-white">
        <q-card-section class="p-4 flex justify-between items-center border-b border-white/10">
          <h3 class="text-lg font-semibold">功能演示视频</h3>
          <q-btn icon="close" flat text-color="white" size="sm" @click="showDemo = false" />
        </q-card-section>
        <q-card-section class="p-0">
          <div class="aspect-video flex items-center justify-center">
            <q-btn icon="play_circle" color="primary" size="64px" @click="showDemo = false" />
            <p class="ml-4 text-white/80">演示视频将在此处播放</p>
          </div>
        </q-card-section>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useQuasar } from 'quasar';

// 状态管理
const $q = useQuasar();
const showMobileMenu = ref(false);
const showDemo = ref(false);
const isPageLoaded = ref(false);

// 页面加载处理
onMounted(() => {
  // 模拟页面加载完成
  setTimeout(() => {
    isPageLoaded.value = true;
  }, 500);

  // 欢迎通知
  $q.notify({
    color: 'primary',
    message: '欢迎使用 NovaManager',
    position: 'top-right',
    icon: 'info',
    timeout: 3000
  });
});

// 滚动到指定区域
const scrollToSection = (id) => {
  const element = document.getElementById(id);
  if (element) {
    element.scrollIntoView({ behavior: 'smooth' });
    showMobileMenu.value = false;
  }
};
</script>

<style scoped>
/* 自定义动画 */
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-fadeIn {
  animation: fadeIn 0.8s ease-out forwards;
}

/* 页面基础样式 */
.welcome-page {
  font-family: 'Inter', system-ui, sans-serif;
}

/* 平滑滚动 */
html {
  scroll-behavior: smooth;
}

/* 滚动间距优化 */
section {
  scroll-margin-top: 80px;
}

/* 响应式调整 */
@media (max-width: 768px) {

  /* 简化移动端样式 */
  .welcome-page main {
    padding-top: 8px;
    padding-bottom: 12px;
  }

  /* 调整英雄区布局 */
  .hero-section {
    flex-direction: column;
    gap: 2rem;
  }

  /* 调整标题大小 */
  .hero-title {
    font-size: 2rem;
    line-height: 1.2;
  }

  /* 调整功能卡片间距 */
  .features-grid {
    grid-template-columns: 1fr;
    gap: 1.5rem;
  }

  /* 隐藏部分装饰元素 */
  .welcome-page .absolute:nth-child(1) {
    display: none;
  }
}

/* 中等屏幕适配 */
@media (min-width: 768px) and (max-width: 1024px) {
  .hero-content {
    padding-right: 2rem;
  }
}
</style>
