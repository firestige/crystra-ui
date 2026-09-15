    const taskSearchControl = section('task-search-control');
    const taskSearchAction = section('task-search-action');
    const taskSearchInput = section('task-search-input');
    const taskSearchClear = section('task-search-clear');
    const taskWorkingSet = section('task-working-set');
    const taskSectionToggle = section('task-section-toggle');
    const taskSectionLabel = section('task-section-label');
    const taskSectionContent = section('task-section-content');
    const taskSectionAttention = section('task-section-attention-badge');
    const taskSectionActions = section('task-section-actions');
    const taskViewOptionsAction = section('task-view-options-action');
    const taskViewOptionsMenu = section('task-view-options-menu');
    const taskList = section('task-list');
    const allTasksAction = section('all-tasks-action');
    const newTaskAction = section('new-task-action');
    const setTaskSearchOpen = (open) => {
      taskSearchControl.dataset.open = String(open);
      taskSearchAction.setAttribute('aria-expanded', String(open));
      taskSearchInput.hidden = !open;
      taskSearchClear.hidden = !open;
      taskSearchInput.tabIndex = open ? 0 : -1;
      taskSectionToggle.hidden = open;
      taskSectionLabel.hidden = open;
      taskSectionActions.hidden = open;
      if (open) {
        taskWorkingSet.dataset.expanded = 'true';
        taskSectionToggle.setAttribute('aria-expanded','true');
        taskSectionContent.hidden = false;
        taskSectionAttention.hidden = true;
        taskSearchInput.focus();
      }
    };
    // Header tools own their pointer/click interactions. CSS separately scopes :hover.
    [taskSearchControl, taskSectionActions].forEach((control) => {
      ['pointerover', 'pointerout', 'mouseover', 'mouseout', 'pointerdown', 'click'].forEach((type) => {
        control.addEventListener(type, (event) => event.stopPropagation());
      });
    });
    taskSearchAction.addEventListener('click', () => {
      setTaskViewOptionsOpen(false);
      const willOpen = taskSearchControl.dataset.open !== 'true';
      if (!willOpen) taskSearchInput.value = '';
      setTaskSearchOpen(willOpen);
      renderTaskList();
    });
    taskSearchClear.addEventListener('click', () => {
      taskSearchInput.value = '';
      setTaskSearchOpen(false);
      renderTaskList();
    });
    taskSearchInput.addEventListener('keydown', (event) => {
      if (event.key !== 'Escape') return;
      taskSearchInput.value = '';
      setTaskSearchOpen(false);
      renderTaskList();
      taskSearchAction.focus();
    });

    const setTaskViewOptionsOpen = (open) => {
      taskViewOptionsAction.setAttribute('aria-expanded', String(open));
      taskViewOptionsMenu.hidden = !open;
    };
    taskViewOptionsAction.addEventListener('click', () => {
      setWorkflowViewOpen(false);
      setTaskViewOptionsOpen(taskViewOptionsAction.getAttribute('aria-expanded') !== 'true');
    });

    const setTaskSectionExpanded = (expanded) => {
      taskWorkingSet.dataset.expanded = String(expanded);
      taskSectionToggle.setAttribute('aria-expanded', String(expanded));
      if (!expanded) {
        taskSearchInput.value = '';
        setTaskSearchOpen(false);
        setTaskViewOptionsOpen(false);
      }
      taskSectionContent.hidden = !expanded;
      taskSearchControl.hidden = false;
      taskSectionActions.hidden = false;
      taskSectionAttention.hidden = expanded;
      if (!expanded) renderTaskList();
    };
    taskSectionToggle.addEventListener('click', () => {
      setTaskSectionExpanded(taskSectionToggle.getAttribute('aria-expanded') !== 'true');
    });

    const wireSidebarDisclosure = (containerName, toggleName, contentName) => {
      const container = section(containerName);
      const toggle = section(toggleName);
      const content = section(contentName);
      toggle.addEventListener('click', () => {
        const expanded = toggle.getAttribute('aria-expanded') !== 'true';
        toggle.setAttribute('aria-expanded', String(expanded));
        container.dataset.expanded = String(expanded);
        content.hidden = !expanded;
      });
    };
    wireSidebarDisclosure('analysis-navigation', 'analysis-section-toggle', 'analysis-section-content');

    const renderTaskList = () => {
      const sortMode = document.querySelector('input[name="task-sort"]:checked').value;
      const filterMode = document.querySelector('input[name="task-filter"]:checked').value;
      const query = taskSearchInput.value.trim().toLocaleLowerCase('zh-CN');
      const taskRows = [...taskList.querySelectorAll('[data-task-row]')];
      const timeField = sortMode === 'activity' ? 'lastEventAt' : 'createdAt';
      taskRows
        .sort((left, right) => new Date(right.dataset[timeField]) - new Date(left.dataset[timeField]))
        .forEach((row) => taskList.append(row));
      taskRows.forEach((row) => {
        const matchesFilter = filterMode === 'all' || row.dataset.taskActive === 'true';
        const matchesQuery = !query || row.textContent.toLocaleLowerCase('zh-CN').includes(query);
        row.hidden = !(matchesFilter && matchesQuery);
      });
    };
    document.querySelectorAll('input[name="task-sort"], input[name="task-filter"]').forEach((input) => input.addEventListener('change', renderTaskList));
    taskSearchInput.addEventListener('input', renderTaskList);
    renderTaskList();

    document.addEventListener('click', (event) => {
      if (taskSearchControl.dataset.open === 'true' && !taskSearchControl.contains(event.target)) {
        taskSearchInput.value = '';
        setTaskSearchOpen(false);
        renderTaskList();
      }
      if (!taskViewOptionsMenu.hidden && !taskViewOptionsMenu.contains(event.target) && !taskViewOptionsAction.contains(event.target)) {
        setTaskViewOptionsOpen(false);
      }
    });

    const workflowPanel = section('workflow-navigation');
    const workflowToggle = section('workflow-section-toggle');
    const workflowContent = section('workflow-section-content');
    const workflowSearchControl = section('workflow-search-control');
    const workflowSearchAction = section('workflow-search-action');
    const workflowSearchInput = section('workflow-search-input');
    const workflowSearchClear = section('workflow-search-clear');
    const workflowActions = section('workflow-section-actions');
    const workflowViewAction = section('workflow-view-options-action');
    const workflowViewMenu = section('workflow-view-options-menu');
    const workflowList = section('workflow-current-list');
    const renderWorkflowList = () => {
      const query = workflowSearchInput.value.trim().toLocaleLowerCase();
      const direction = document.querySelector('input[name="workflow-sort"]:checked').value === 'descending' ? -1 : 1;
      const showVersion = section('workflow-show-version').checked;
      [...workflowList.querySelectorAll('[data-workflow-definition-id]')]
        .sort((a,b) => direction * a.dataset.workflowDefinitionId.localeCompare(b.dataset.workflowDefinitionId))
        .forEach(row => {
          row.hidden = !row.dataset.workflowDefinitionId.toLocaleLowerCase().includes(query);
          row.querySelector('[data-type="meta"]').hidden = !showVersion;
          workflowList.append(row);
        });
    };
    const setWorkflowViewOpen = open => {
      workflowViewAction.setAttribute('aria-expanded',String(open));
      workflowViewMenu.hidden = !open;
    };
    const setWorkflowSearchOpen = open => {
      workflowSearchControl.dataset.open = String(open);
      workflowSearchAction.setAttribute('aria-expanded',String(open));
      workflowSearchInput.hidden = !open;
      workflowSearchInput.tabIndex = open ? 0 : -1;
      workflowSearchClear.hidden = !open;
      workflowToggle.hidden = open;
      workflowActions.hidden = open;
      if (open) {
        workflowPanel.dataset.expanded = 'true';
        workflowToggle.setAttribute('aria-expanded','true');
        workflowContent.hidden = false;
        workflowSearchInput.focus();
      } else { workflowSearchInput.value = ''; renderWorkflowList(); }
    };
    const setWorkflowExpanded = expanded => {
      setWorkflowSearchOpen(false); setWorkflowViewOpen(false);
      workflowPanel.dataset.expanded = String(expanded);
      workflowToggle.setAttribute('aria-expanded',String(expanded));
      workflowContent.hidden = !expanded;
    };
    [workflowSearchControl,workflowActions].forEach(control => {
      ['pointerover','pointerout','mouseover','mouseout','pointerdown','click'].forEach(type => control.addEventListener(type,event=>event.stopPropagation()));
    });
    workflowSearchAction.addEventListener('click',()=>{
      setWorkflowViewOpen(false);setTaskViewOptionsOpen(false);
      setWorkflowSearchOpen(workflowSearchControl.dataset.open !== 'true');
    });
    workflowSearchClear.addEventListener('click',()=>{setWorkflowSearchOpen(false);workflowSearchAction.focus();});
    workflowSearchInput.addEventListener('input',renderWorkflowList);
    workflowViewAction.addEventListener('click',()=>{
      setTaskViewOptionsOpen(false);setWorkflowViewOpen(workflowViewMenu.hidden);
    });
    workflowToggle.addEventListener('click',()=>setWorkflowExpanded(workflowPanel.dataset.expanded !== 'true'));
    document.querySelectorAll('input[name="workflow-sort"], [data-section-id="workflow-show-version"]').forEach(input=>input.addEventListener('change',renderWorkflowList));
    document.addEventListener('pointerdown',event=>{
      if (!section('workflow-section-header').contains(event.target)) setWorkflowViewOpen(false);
      if (workflowSearchControl.dataset.open === 'true' && !workflowSearchControl.contains(event.target)) setWorkflowSearchOpen(false);
    },true);
    document.addEventListener('keydown',event=>{
      if(event.key !== 'Escape') return;
      if(workflowSearchControl.dataset.open === 'true') {
        setWorkflowSearchOpen(false);workflowSearchAction.focus();event.preventDefault();event.stopImmediatePropagation();
      } else if(!workflowViewMenu.hidden) {
        setWorkflowViewOpen(false);workflowViewAction.focus();event.preventDefault();event.stopImmediatePropagation();
      }
    },true);
    renderWorkflowList();



  (() => {
    const shell = section('app-shell');
    const sidebar = section('sidebar');
    const toggle = section('sidebar-toggle');
    const banner = section('surface-banner');
    const tooltip = section('sidebar-tooltip');
    const routes = {
      tasks: {panel: section('task-working-set'), toggle: section('task-section-toggle'), content: section('task-section-content')},
      workflows: {panel: section('workflow-navigation'), toggle: section('workflow-section-toggle'), content: section('workflow-section-content')},
      analysis: {panel: section('analysis-navigation'), toggle: section('analysis-section-toggle'), content: section('analysis-section-content')}
    };
    let active = null;
    let savedExpanded = null;
    let tooltipOwner = null;
    const collapsed = () => shell.dataset.sidebarCollapsed === 'true';
    const hideTooltip = () => {
      tooltip.hidden = true;
      if (tooltipOwner) tooltipOwner.removeAttribute('aria-describedby');
      tooltipOwner = null;
    };
    const closePanel = (restoreFocus = false) => {
      if (!active) return;
      const name = active;
      const route = routes[name];
      if (name === 'tasks') {
        taskSearchInput.value = '';
        setTaskSearchOpen(false);
        setTaskViewOptionsOpen(false);
        setTaskSectionExpanded(savedExpanded);
        renderTaskList();
      } else if (name === 'workflows') {
        setWorkflowExpanded(savedExpanded);
      } else {
        route.panel.dataset.expanded = String(savedExpanded);
        route.toggle.setAttribute('aria-expanded', String(savedExpanded));
        route.content.hidden = !savedExpanded;
      }
      route.panel.removeAttribute('data-sidebar-flyout');
      section('sidebar-rail-' + name).setAttribute('aria-expanded', 'false');
      active = null;
      if (restoreFocus) section('sidebar-rail-' + name).focus();
    };
    const syncBanner = () => {
      const isCrystra = shell.dataset.productSurface === 'crystra';
      section('sidebar-brand-name').textContent = isCrystra ? 'Crystra' : 'DeepSeek';
      const label = collapsed() ? '展开侧边栏' : isCrystra ? '切换到 DeepSeek Harness' : '切换到 Crystra';
      banner.setAttribute('aria-label', label);
      banner.title = label;
      banner.dataset.sidebarTooltip = label;
      if (collapsed()) {
        banner.setAttribute('aria-expanded', 'false');
        banner.setAttribute('aria-controls', 'crystra-sidebar');
      } else {
        banner.removeAttribute('aria-expanded');
        banner.removeAttribute('aria-controls');
      }
    };
    const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
    let motionTimer;
    let contentAnimations = [];
    const finishMotion = () => {
      clearTimeout(motionTimer);
      delete shell.dataset.sidebarAnimating;
      contentAnimations.forEach(animation => animation.cancel());
      contentAnimations = [];
      sidebar.querySelector('[data-sidebar-drawer]').inert = false;
    };
    reducedMotion.addEventListener('change', finishMotion);
    const setCollapsed = (value, focusToggle = true) => {
      finishMotion();
      const animate = shell.dataset.sidebarMotion === 'ready' && !reducedMotion.matches;
      if (animate) shell.dataset.sidebarAnimating = 'true';
      sidebar.querySelector('[data-sidebar-drawer]').inert = animate && value;
      closePanel(false);
      hideTooltip();
      taskSearchInput.value = '';
      setTaskSearchOpen(false);
      setTaskViewOptionsOpen(false);
      renderTaskList();
      setWorkflowSearchOpen(false);
      setWorkflowViewOpen(false);
      shell.dataset.sidebarCollapsed = String(value);
      callbacks.onSidebarCollapsedChange?.(value);
      toggle.setAttribute('aria-expanded', String(!value));
      toggle.setAttribute('aria-label', value ? '展开侧边栏' : '收起侧边栏');
      toggle.title = value ? '展开侧边栏' : '收起侧边栏';
      syncBanner();
      if (animate) {
        // Directory contents keep their geometry and slide with the animated edge.
        // Only the compact rail crossfades near the end of the closing motion.
        if (value) contentAnimations = [section('sidebar-rail').animate(
          [{opacity: 0}, {opacity: 1}],
          {duration: 100, delay: 220, easing: 'ease-out', fill: 'backwards'}
        )];
        motionTimer = setTimeout(finishMotion, 360);
      }
      if (focusToggle) (value ? banner : toggle).focus({preventScroll:true});
    };
    toggle.addEventListener('click', () => setCollapsed(!collapsed()));
    banner.addEventListener('click', () => {
      if (collapsed()) { setCollapsed(false); return; }
      finishMotion();
      closePanel(false);
      hideTooltip();
      // Local surface preview. Host integration must replace its new-session handler.
      callbacks.onOpenHarness();
      syncBanner();
    });
    syncBanner();
    Object.entries(routes).forEach(([name, route]) => {
      const button = section('sidebar-rail-' + name);
      button.addEventListener('click', () => {
        finishMotion();
        hideTooltip();
        if (active === name) {closePanel(true); return;}
        closePanel(false);
        active = name;
        savedExpanded = route.panel.dataset.expanded === 'true';
        if (name === 'tasks') setTaskSectionExpanded(true);
        else if (name === 'workflows') setWorkflowExpanded(true);
        else {
          route.panel.dataset.expanded = 'true';
          route.toggle.setAttribute('aria-expanded','true');
          route.content.hidden = false;
        }
        route.panel.dataset.sidebarFlyout = 'open';
        button.setAttribute('aria-expanded', 'true');
        route.toggle.focus({preventScroll:true});
      });
    });
    document.addEventListener('pointerdown', event => {
      if (active && !routes[active].panel.contains(event.target) && !event.target.closest('[data-section-id="sidebar-rail"]')) closePanel(false);
    });
    document.addEventListener('keydown', event => {
      if (event.key !== 'Escape') return;
      if (active) {
        // Search and view menu get first Escape; the next closes the directory.
        if (active === 'tasks' && taskSearchControl.dataset.open === 'true') {
          taskSearchInput.value = ''; setTaskSearchOpen(false); renderTaskList();
          taskSearchAction.focus(); event.preventDefault(); event.stopImmediatePropagation(); return;
        }
        if (active === 'tasks' && !taskViewOptionsMenu.hidden) {setTaskViewOptionsOpen(false);event.preventDefault();return;}
        closePanel(true);event.preventDefault();
      }
      hideTooltip();
    }, true);
    sidebar.addEventListener('click',event=>{
      if (active && event.target.closest('a, [data-task-row], [data-section-id="new-task-action"]')) closePanel(false);
    });
    const updateAttention = () => {
      const count = [...taskList.querySelectorAll('[data-task-row] [data-section-id$="attention-badge"]')].reduce((sum, badge) => sum + (Number(badge.textContent.trim()) || 0), 0);
      const badge = section('sidebar-rail-task-attention');
      badge.textContent = count > 99 ? '99+' : String(count);
      badge.hidden = count === 0;
      const button = section('sidebar-rail-tasks');
      const label = count ? `任务 · ${count} 项需要关注` : '任务';
      button.setAttribute('aria-label',label);
      button.dataset.sidebarTooltip = label;
    };
    refreshAttention = updateAttention;
    updateAttention();
    new MutationObserver(updateAttention).observe(taskList,{subtree:true,childList:true,characterData:true});
    sidebar.querySelectorAll('[data-sidebar-tooltip], [data-header-tooltip]').forEach(button=>{
      const show = () => {
        if (!button.dataset.headerTooltip && (!collapsed() || active)) return;
        hideTooltip();tooltipOwner=button;
        tooltip.textContent=button.dataset.headerTooltip || button.dataset.sidebarTooltip;
        tooltip.hidden=false;
        const r=button.getBoundingClientRect();
        tooltip.style.left=(button.dataset.headerTooltip ? Math.max(8,Math.min(innerWidth-tooltip.offsetWidth-8,r.left+(r.width-tooltip.offsetWidth)/2)) : r.right+12)+'px';
        tooltip.style.top=Math.max(8,Math.min(innerHeight-tooltip.offsetHeight-8,button.dataset.headerTooltip ? r.bottom+8 : r.top+(r.height-tooltip.offsetHeight)/2))+'px';
        button.setAttribute('aria-describedby','crystra-sidebar-tooltip');
      };
      button.addEventListener('mouseenter',show);
      button.addEventListener('focus',show);
      button.addEventListener('mouseleave',hideTooltip);
      button.addEventListener('blur',hideTooltip);
      button.addEventListener('click',hideTooltip);
    });
    window.addEventListener('resize', hideTooltip);
    if (callbacks.initialSidebarCollapsed) setCollapsed(true, false);
    // Initial URL state is applied immediately, without an entrance animation.
    requestAnimationFrame(() => requestAnimationFrame(() => { shell.dataset.sidebarMotion = 'ready'; }));
  })();
  