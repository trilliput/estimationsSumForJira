import $ from 'jquery';

var parseEstimationValue = function(estimationValue) {
	var sumInHours = 0;
	var timeUnit = estimationValue[estimationValue.length-1];
	var timeValue = parseFloat(estimationValue);
	console.log("found card value: " + timeValue + " with unit " + timeUnit);

	switch(timeUnit) {
		case "w": sumInHours = timeValue * 8 * 5;
		break;
		case "d": sumInHours = timeValue * 8;
		break;
		case "h": sumInHours = timeValue;
		break;
		default: console.log("Oops. Don't know how to handle time unit '" + timeUnit + "'. Please report me!");
	}
	return sumInHours
}

var handleCard = function(card) {
	console.log("new card " + $(card).data("issue-key"));

	// Jira: on-prem
	var spanWithEstimate = $(card).find(".ghx-corner span.aui-badge");
	if(!spanWithEstimate || spanWithEstimate.length == 0) {
		// Jira: cloud
		spanWithEstimate = $(card).find("aui-badge.ghx-estimate");
		if(!spanWithEstimate || spanWithEstimate.length == 0) {
			// Jira version 7.11.0 KANBAN boards do not tell remaining days in a structured way
			// this is a good guess how to get it, but obviously not reliable
			var spanWithEstimate = $(card).find('[data-tooltip~="Remaining"]').children(".ghx-extra-field-content");
			if(!spanWithEstimate || spanWithEstimate.length == 0) {
				return NaN;
			}
		}
	}

	var sumInHours = 0;
	var content = $(spanWithEstimate).html();
	if (content.length > 1 && content.toLowerCase() != 'none') {
		console.log("card content: " + content);
		content.split(" ").forEach(function(item, index) {
			sumInHours += parseEstimationValue(item)
		});
		return sumInHours;
	}
};

var handleColumn = function(column, columnIdx, sumPerColumn, noPerColumn) {
	console.log("new column, id=" + $(column).data("column-id"));

	var cards = $(column).find(".ghx-issue");
	sumPerColumn[columnIdx] = 0;
	noPerColumn[columnIdx] = 0;
	
	cards.each(function() {
		var cardValue = handleCard(this);
		if(typeof cardValue != "undefined" && !isNaN(cardValue)) {
			sumPerColumn[columnIdx] += parseFloat(cardValue)/8;
		}
		noPerColumn[columnIdx] += 1;
	});
	console.log("SUM FOR COLUMN #" + columnIdx + " is: " + sumPerColumn[columnIdx] + " days");
	
};

var handleSprintGroup = function(backlogGroup, backlogGroupIdx, sumPerBacklogGroup, noPerBacklogGroup) {
	var cards = $(backlogGroup).find(".ghx-issue-compact");
	sumPerBacklogGroup[backlogGroupIdx] = 0;
	noPerBacklogGroup[backlogGroupIdx] = 0;
	
	cards.each(function() {
		var cardValue = handleCard(this);
		console.log(cardValue)
		if(typeof cardValue != "undefined" && !isNaN(cardValue)) {
			sumPerBacklogGroup[backlogGroupIdx] += parseFloat(cardValue)/8;
		}
		noPerBacklogGroup[backlogGroupIdx] += 1;
	});
	console.log("SUM FOR COLUMN #" + backlogGroupIdx + " is: " + sumPerBacklogGroup[backlogGroupIdx] + " days");
	
};

var refreshDashboard = function() {
	var sumPerColumn = [];
	var noPerColumn = [];

	var swimlanes = $("#ghx-pool .ghx-swimlane");
	swimlanes.each(function() {
		console.log("new swimlane ");
		var columns = $(this).find(".ghx-columns .ghx-column");
		var columnIdx = 0;
		columns.each(function() {
			handleColumn(this, columnIdx, sumPerColumn, noPerColumn);
			++columnIdx;
		});
	});

	var headers = $("#ghx-column-headers .ghx-column");
	var columnIdx = 0;
	headers.each(function() {
		console.log("new header");
		var divQty = $(this).find(".sumcount");
		if(divQty.length == 0) {
			if(typeof sumPerColumn[columnIdx] != "undefined") {
				console.log("Setting header #" + columnIdx + " to: " + sumPerColumn[columnIdx]);
				$(this).append("<span class='sumcount label label-default'>" + (Math.round(sumPerColumn[columnIdx]*10)/10) + "d (" + noPerColumn[columnIdx] + ")</span>");
			}
		}
		++columnIdx;
	});

};

var refreshBacklog = function() {
	// var sprintGroups = $(".ghx-sprint-group");
	var sprintGroups = $(".js-sprint-container");
	var sumPerGroup = [];
	var noPerGroup = [];
	var groupIdx = 0;
	sprintGroups.each(function() {
		console.log("new sprint group");
		handleSprintGroup(this, groupIdx, sumPerGroup, noPerGroup);
		console.log(sumPerGroup);

		var statsContainer = $(this).find('.ghx-stats .ghx-stat-total');
		if(statsContainer.length == 0) {
			return
		}

		var divQty = statsContainer.find(".sumcount");
		if(divQty.length > 0) {
			return
		}

		if(typeof sumPerGroup[groupIdx] == "undefined") {
			return
		}
		
		var roundedSum = Math.round(sumPerGroup[groupIdx]*10)/10;
		console.log("Setting sprint estimation #" + groupIdx + " to: " + sumPerGroup[groupIdx]);
		statsContainer.append('<aui-badge class="sumcount" title="' + roundedSum + ' Days">+ ' + roundedSum + 'd</aui-badge>');

		++groupIdx;
	});
}

setInterval(function() {
	refreshDashboard();
	refreshBacklog();
}, 3000);
