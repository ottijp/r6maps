'use strict';

(function(pagecode) { //eslint-disable-line wrap-iife
  pagecode(window.jQuery, window, document, R6MLangTerms, R6MStatsMetaData, R6MStatsControls, R6MStatsRender, R6MStatsOpChart);
}(function($, window, document, R6MLangTerms, R6MStatsMetaData, R6MStatsControls, R6MStatsRender, R6MStatsOpChart, undefined) {
  var $headers = {},
    $sections = {},
    $outputs = {},
    $controls = {},
    $opChart = {},
    $loadButton,
    $ranksShowHider,
    metaData,
    statTerms,
    lastLoadSnapshot = {
      filters: {}
    },
    QUERY_PARAMS = {
      SEASON: 'season',
      PLATFORM: 'platform',
      MAP: 'map',
      MODE: 'mode',
      LOCATION: 'location'
    };

  $(function() { // equivanelt to $(document).ready() - but a bit faster
    R6MHelpers.tryLoadStartingLanguage(R6MLangTerms.tryLoadLanguage);
    R6MHelpers.tryChangeDirection(R6MLangTerms.getLoadedDirection());
    metaData = R6MStatsMetaData.getData();
    statTerms = R6MLangTerms.terms.stats;
    R6MStatsRender.setPageTitle();
    assignPageElements();
    R6MStatsRender.renderHeaders($headers);
    R6MStatsRender.renderStaticEl($('p.all-text'), $('#instructions'));
    R6MStatsRender.renderAbout($('#about-output'));
    setupControls();
    setupOpChart();
    window.onpopstate = handleHistoryPop;
    $('body').removeClass('doc-not-ready');

    if (checkAnyParamsSet()) {
      handleLoadButtonClick();
    }
  });

  var assignPageElements = function assignPageElements() {
    $headers.main = $('#header-main');
    $headers.mapSection = $('#section-map h2');
    $headers.opSection = $('#section-operators h2');
    $headers.filters = $('nav h2');

    $sections.maps = $('#section-map');
    $outputs.mapSection = $('#section-map div.output');
    $sections.ops = $('#section-operators');
    $outputs.opSection = $('#section-operators div.output');
    $controls.seasons = $('#seasons-control'),
    $controls.platforms = $('#platforms-control'),
    $controls.maps = $('#maps-control'),
    $controls.modes = $('#game-modes-control'),
    $controls.locations = $('#objective-locations-control'),
    $loadButton = $('#load-control'),
    $controls.ranks = $('#skill-ranks-control');
    $ranksShowHider = $('#skill-ranks-show-hider');

    $opChart.root = $('#op-chart');
    $opChart.dialog = $opChart.root.find('.dialog');
    $opChart.close = $opChart.root.find('.close');
    $opChart.output = $opChart.root.find('.output');
    $opChart.header = $opChart.root.find('h2');
    $opChart.info = $opChart.root.find('.info');
  };

  var checkAnyParamsSet = function checkAnyParamsSet() {
    for (var param in QUERY_PARAMS) {
      if (R6MHelpers.queryString(QUERY_PARAMS[param])) {
        return true;
      }
    }
    return false;
  };

  var closeOpChart = function closeOpChart() {
    $('body').removeClass('op-chart-open');
  };

  var disableLoadControl = function disableLoadControl() {
    $('body').addClass('disable-load');
  };

  var enableLoadControl = function enableLoadControl() {
    $('body').removeClass('disable-load');
  };

  var getSkillRanksForSeason = function getSkillRanksForSeason(selectedSeason) {
    var sd,
      result = [];

    for (var key in metaData.ranks) {
      sd = metaData.ranks[key];
      if ((selectedSeason >= sd.seasonSpan[0]) && (selectedSeason <= sd.seasonSpan[1])) {
        result.push(key);
      }
    }
    return result;
  };

  var handleGameModeChange = function handleGameModeChange() {
    R6MStatsControls.locations.update($controls.locations,
      metaData.mapModeLocations,
      R6MStatsControls.seasons.get($controls.seasons),
      R6MStatsControls.maps.get($controls.maps),
      R6MStatsControls.modes.get($controls.modes)
    );
    enableLoadControl();
  };

  var handleApiAllSuccess = function handleApiAllSuccess() {
    $('body').removeClass('load-in-progress');
    document.activeElement.blur();
    enableLoadControl();
  };

  var handleApiMapSuccess = function handleApiMapSuccess(mapApiData) {
    R6MStatsMapData.set(mapApiData, metaData.winReasons);
    R6MStatsMapRender.render($outputs.mapSection, R6MStatsMapData.get(), metaData, R6MStatsRender.getFormattedNumber);
    $sections.maps.removeClass('load-in-progress');
    if (DEV_MODE) {
      console.log('Map success', R6MStatsMapData.get());
    }
  };

  var handleApiMapError = function handleApiMapError(mapData) {
    $('body').removeClass('load-in-progress');
    $sections.maps.removeClass('load-in-progress');
    R6MStatsRender.renderLoadError($outputs.mapSection);
  };

  var handleApiOpSuccess = function handleApiOpSuccess(opApiData, mapApiData) {
    R6MStatsOpData.set(
      opApiData,
      R6MStatsMapData.getTotalRoundsFromApiData(mapApiData),
      metaData.operators
    );
    tryLoadOpSortField();

    renderOpStats();
    $sections.ops.removeClass('load-in-progress');
    if (DEV_MODE) {
      console.log('Operators success', R6MStatsOpData.get());
    }
  };

  var handleApiOpError = function handleApiOpError(operatorsData) {
    $sections.ops.removeClass('load-in-progress');
    $outputs.opSection.html('<p class="error">' + R6MLangTerms.terms.stats.error + '</p>');
  };

  var handleHistoryPop = function handleHistoryPop() {
    setupControls();
    enableLoadControl();
  };

  var handleLoadButtonClick = function handleLoadButtonClick() {
    var possibleParams = [
        { string: QUERY_PARAMS.SEASON, currentValue: R6MStatsControls.seasons.get($controls.seasons)},
        { string: QUERY_PARAMS.PLATFORM, currentValue: R6MStatsControls.platforms.get($controls.platforms)},
        { string: QUERY_PARAMS.MAP, currentValue: R6MStatsControls.maps.get($controls.maps)},
        { string: QUERY_PARAMS.MODE, currentValue: R6MStatsControls.modes.get($controls.modes)},
        { string: QUERY_PARAMS.LOCATION, currentValue: R6MStatsControls.locations.get($controls.locations)}
      ],
      queryString = '',
      counter = 0;

    possibleParams.forEach(function(param) {
      if (param.currentValue && (param.currentValue != R6MStatsControls.ALL_KEY)) {
        queryString += (counter == 0) ? '?' : '&';
        queryString += param.string + '=' + param.currentValue;
        counter++;
      }
      lastLoadSnapshot.filters[param.string] = param.currentValue;
    });

    history.pushState({}, '', [location.protocol, '//', location.host, location.pathname].join('') + queryString);
    lastLoadSnapshot.ranks = getSkillRanksForSeason(R6MStatsControls.seasons.get($controls.seasons));

    $outputs.opSection.empty();
    $outputs.mapSection.empty();

    $('body').removeClass('not-loaded-yet');
    $sections.maps.addClass('load-in-progress');
    $sections.ops.addClass('load-in-progress');
    $('body').addClass('load-in-progress');
    disableLoadControl();

    savePlatformOption(R6MStatsControls.platforms.get($controls.platforms));
    sendLoadStatsAnalyticsEvent(queryString);

    renderLoadInfo($('#loaded-summary'));

    R6MStatsApi.getMapAndOperators(
      handleApiMapSuccess,
      handleApiMapError,
      handleApiOpSuccess,
      handleApiOpError,
      handleApiAllSuccess,
      queryString,
      metaData
    );
  };

  var handleMapChange = function handleMapChange() {
    var selectedSeason = R6MStatsControls.seasons.get($controls.seasons),
      selectedMap = R6MStatsControls.maps.get($controls.maps);

    R6MStatsControls.modes.update(
      $controls.modes,
      metaData.modes,
      metaData.mapModeLocations,
      selectedSeason,
      selectedMap
    );
    R6MStatsControls.locations.update(
      $controls.locations,
      metaData.mapModeLocations,
      selectedSeason,
      selectedMap,
      R6MStatsControls.modes.get($controls.modes)
    );
    enableLoadControl();
  };

  var handleSeasonChange = function handleSeasonChange() {
    var selectedSeason = R6MStatsControls.seasons.get($controls.seasons);

    R6MStatsControls.platforms.update(
      $controls.platforms,
      metaData.platforms,
      selectedSeason
    );

    R6MStatsControls.maps.update(
      $controls.maps,
      metaData.mapModeLocations,
      selectedSeason
    );
    handleMapChange();

    R6MStatsControls.ranks.setup(
      $controls.ranks,
      metaData.ranks,
      R6MStatsControls.seasons.get($controls.seasons),
      handleSkillRankChange
    );
    handleSkillRankChange();

    enableLoadControl();
  };

  var handleSkillRankChange = function handleSkillRankChange() {
    var selectedSkillRanks = R6MStatsControls.ranks.get($controls.ranks);

    $ranksShowHider.removeClass();
    selectedSkillRanks.forEach(function(rank) {
      $ranksShowHider.addClass('show-' + metaData.ranks[rank].cssClass);
    });
    saveSkillRankOptions(selectedSkillRanks);
  };

  var renderLoadInfo = function renderLoadInfo($infoEl) {
    R6MStatsRender.renderLoadInfo($infoEl, lastLoadSnapshot.filters, metaData);
  };

  var renderOpStats = function renderOpStats() {
    R6MStatsOpRender.render(
      R6MStatsOpData.get(),
      $outputs.opSection,
      metaData.ranks,
      metaData.roles,
      metaData.statTypes,
      lastLoadSnapshot.ranks,
      resortOperators,
      updateOpRoleChart,
      R6MStatsRender.getFormattedNumber
    );
  };

  var resortOperators = function resortOperators(sortField, isDescending, sortRank) {
    R6MStatsOpData.trySort(sortField, isDescending, sortRank);
    renderOpStats();
    saveOperatorsSortField(sortField, isDescending, sortRank);
  };

  var saveOperatorsSortField = function saveOperatorsSortField(sortField, isDescending, optionalRank) {
    localStorage.setItem('statssortfield', sortField + ',' + isDescending + ',' + optionalRank);
  };

  var savePlatformOption = function savePlatformOption(platformOption) {
    localStorage.setItem('statsplatform', platformOption);
  };

  var saveSkillRankOptions = function saveSkillRankOptions(selectedSkillRanks) {
    localStorage.setItem('statsskillrankoptions', selectedSkillRanks.join());
  };

  var setupControls = function setupControls() {
    R6MStatsControls.seasons.setup(
      $controls.seasons,
      metaData.seasons,
      handleSeasonChange
    );
    R6MStatsControls.seasons.trySelect($controls.seasons, R6MHelpers.queryString(QUERY_PARAMS.SEASON));

    R6MStatsControls.platforms.setup(
      $controls.platforms,
      metaData.platforms,
      R6MStatsControls.seasons.get($controls.seasons),
      enableLoadControl
    );
    tryLoadSavedPlatformOption();
    R6MStatsControls.platforms.trySelect($controls.platforms, R6MHelpers.queryString(QUERY_PARAMS.PLATFORM));

    R6MStatsControls.maps.setup(
      $controls.maps,
      metaData.mapModeLocations,
      R6MStatsControls.seasons.get($controls.seasons),
      handleMapChange
    );
    R6MStatsControls.maps.trySelect($controls.maps, R6MHelpers.queryString(QUERY_PARAMS.MAP));

    R6MStatsControls.modes.setup(
      $controls.modes,
      metaData.modes,
      metaData.mapModeLocations,
      handleGameModeChange,
      R6MStatsControls.seasons.get($controls.seasons),
      R6MStatsControls.maps.get($controls.maps)
    );
    R6MStatsControls.modes.trySelect($controls.modes, R6MHelpers.queryString(QUERY_PARAMS.MODE));

    R6MStatsControls.locations.setup(
      $controls.locations,
      metaData.mapModeLocations,
      R6MStatsControls.seasons.get($controls.seasons),
      R6MStatsControls.maps.get($controls.maps),
      R6MStatsControls.modes.get($controls.modes),
      enableLoadControl
    );
    R6MStatsControls.locations.trySelect($controls.locations, R6MHelpers.queryString(QUERY_PARAMS.LOCATION));

    R6MStatsControls.ranks.setup(
      $controls.ranks,
      metaData.ranks,
      R6MStatsControls.seasons.get($controls.seasons),
      handleSkillRankChange
    );
    tryLoadSavedSkillRankOptions();
    handleSkillRankChange();

    $loadButton.html(statTerms.loadButtonText);
    $loadButton.on('click', handleLoadButtonClick);
  };

  var setupOpChart = function setupOpChart() {
    $opChart.close.on('click', closeOpChart);
    $opChart.root.on('click', function(e) {
      if ($(e.target).attr('id') == 'op-chart') {
        closeOpChart();
      }
    });
  };

  var sendLoadStatsAnalyticsEvent = function sendLoadStatsAnalyticsEvent(queryString) {
    // ga('send', {
    //   hitType: 'event',
    //   eventCategory: 'Controls',
    //   eventAction: 'LoadStats',
    //   eventLabel: queryString
    // });
  };

  var updateOpRoleChart = function updateOpRoleChart(skillKey, roleKey) {
    $('body').addClass('op-chart-open');
    R6MStatsOpChart.updateOpRoleChart(
      $opChart,
      R6MStatsOpData.get(),
      skillKey,
      roleKey,
      lastLoadSnapshot.filters,
      lastLoadSnapshot.ranks,
      metaData,
      R6MStatsRender.getFormattedNumber,
      renderLoadInfo
    );
  };

  var tryLoadOpSortField = function tryLoadOpSortField() {
    var sortFieldOptions = localStorage.getItem('statssortfield'),
      sortField,
      optionalRank,
      isDescending,
      tempSplit;

    if (sortFieldOptions) {
      tempSplit = sortFieldOptions.split(',');
      sortField = tempSplit[0];
      isDescending = (tempSplit[1] == 'true');
      optionalRank = tempSplit[2];
    } else {
      sortField = 'name'; //fallback
    }
    R6MStatsOpData.trySort(sortField, isDescending, optionalRank);
  };

  var tryLoadSavedPlatformOption = function tryLoadSavedPlatformOption() {
    var platformOption = localStorage.getItem('statsplatform');

    if (platformOption !== null) {
      R6MStatsControls.platforms.trySelect($controls.platforms, platformOption);
    }
  };

  var tryLoadSavedSkillRankOptions = function tryLoadSavedSkillRankOptions() {
    var previouslySelectedSkillRanks = localStorage.getItem('statsskillrankoptions');

    if (previouslySelectedSkillRanks) {
      R6MStatsControls.ranks.trySelect(
        $controls.ranks,
        previouslySelectedSkillRanks.split(',')
      );
    }
  };
}));
