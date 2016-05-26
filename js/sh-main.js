$(function(){
	var started = false;
	var state = 0;
	//start();
	// chrome.commands.onCommand.addListener(function(command) {
 //        console.log('Command:', command);
 //      });
	
	chrome.runtime.onMessage.addListener(
	    function(request, sender, sendResponse) {
	        start();
	});

	function start(){
		if(started){
			alert("本插件已经启动");
			return;
		}
		started = true;


		console.log("Scraping Helper:Successfully Injected!");
		
		$("*").hover(function(e){
			if(state !== 0){
				return;
			}
			removeAllElementClass("sh-hover");
			removeAllElementClass("sh-predict");
			e.stopPropagation();
			e.preventDefault();
			
			var path = $(this).getFullPathName(true);
			var selected_node = $(this);
			$($(this).prop("tagName").toLowerCase()).each(function(){
				var this_path = $(this).getFullPathName(true);
				if(this_path == path){
					$(this).css("border","soild");
					$(this).addClass("sh-hover");
				}
			});
			updateSuggestion();
			
		});
		$("*").click(function(e){
			state = 1;
			e.stopPropagation();
			e.preventDefault();
			removeAllElementClass("sh-predict");
			if($(this).hasClass("sh-select")){
				$(this).removeClass("sh-select");
				
			}else{
				if($(this).prop("tagName") == $(".sh-hover").prop("tagName") || $(this).prop("tagName") == $(".sh-select").prop("tagName")){
					$(this).addClass("sh-select");
				}
				
			}
			$(".sh-hover").addClass("sh-select").removeClass("sh-hover");
			
			updateSuggestion();
			
		});
		addPanel();
	}
	var isShowingModal = false;
	function addPanel(){
		$("body").append("<div id='sh-panel' class='sh-move-to-right'><h4>内容选择器控制面板</h4><hr><ul><li id='sh-action-reset'>重置</li><li id='sh-action-close'>关闭</li><li id='sh-action-copy-selector'>拷贝选择器</li><li id='sh-action-copy-content'>拷贝内容</li></ul><div id='sh-suggestion'></div></div><div id='sh-modal'></div>");

		$("#sh-action-reset").click(function(e){
			e.stopPropagation();
			removeAllElementClass("sh-select");
			removeAllElementClass("sh-hover");
			removeAllElementClass("sh-predict");
			$("#sh-modal").hide();
			state = 0;
		});
		$("#sh-action-close").click(function(e){
			window.location.reload();
		});
		
		$("#sh-action-copy-selector").click(function(e){
			e.stopPropagation();
			if(state ==0){
				return;
			}
			if(isShowingModal){
				$("#sh-modal").hide();
				$("#sh-action-copy-selector").text("拷贝选择器");
			}else{
				$("#sh-modal").html($("#sh-suggestion-code").text()).show();
				$("#sh-action-copy-selector").text("关闭");
			}
			isShowingModal = !isShowingModal;
		});

		$("#sh-action-copy-content").click(function(e){
			e.stopPropagation();
			if(state ==0){
				return;
			}
			var data = "";
			$(".sh-select").each(function(){
				data += "<p>"+$(this).text() + "</p><br>";
			});
			
			if(isShowingModal){
				$("#sh-modal").hide();
				$("#sh-action-copy-content").text("拷贝内容");
			}else{
				$("#sh-action-copy-content").text("关闭");
				$("#sh-modal").html(data).show();
			}
			isShowingModal = !isShowingModal;
		});
		
	}
	

	function updateSuggestion(){
		apporach1_BreadthFirstSearch();
	}
	var current_best_solution = "";
	var current_best_different = 99999999999;
	function apporach1_BreadthFirstSearch(){
		var currentUseingClassName = state === 0 ? "sh-hover" : "sh-select";
		console.log("============================================================");
		var currentSelected = $("."+currentUseingClassName);

		var path;
		var count = currentSelected.length;
		var suggestion = "";
		var findSolution = false;


		if(currentSelected.length>0){
			path = currentSelected.getFullPathName(true);

			findSolution = true;
			var currentNode = $(currentSelected[0]);
			suggestion = "";
			while(!isCorrectSelection(currentSelected,suggestion) && currentNode.prop("tagName") !== "BODY" ){
				findSolution = false;
				console.log(currentNode);
				var classList = currentNode.attr('class')===undefined ? [] :currentNode.attr('class').split(/\s+/);

				// loop though all possible class attritube to see if we are able to succfully select 
				
				$.each(classList, function(index, item) {
					
					if(item == 'sh-select' || item == 'sh-hover' || item == '' || item == 'sh-prdict'){
						return;
					}
					
					var trival_solution = currentNode.prop("tagName").toLowerCase()+"."+item +" "+  suggestion;
					if(isCorrectSelection(currentSelected,trival_solution)){
						findSolution = true;
						suggestion = trival_solution;
						console.log("Solution Found!");
						return false;
					}
				});
				if(findSolution){
					break;
				}
				console.log("go to upper level tree for answer");
				suggestion = currentNode.prop("tagName").toLowerCase() + " "+suggestion;
				currentNode = currentNode.parent();
			}
		}
		
		if(!findSolution){
			suggestion = "找不到合适的选择器！";
			if(current_best_solution!= ""){
				suggestion += "<br>最接近选择为:"+current_best_solution;
			}

		}
		$("#sh-suggestion").html("元素路径："+path.toLowerCase()+"<br>选择数量："+count+"<br>选择器：<span id='sh-suggestion-code'>"+suggestion+"</span>");
		return findSolution;
	}

	function isCorrectSelection(currentSelected,selector){
		var selectorResult = $(selector);
		console.log("---Testing:"+selector+'---');
		console.log("CurrentSelected:" + currentSelected.length);
		console.log("SelectorSelected: "+ selectorResult.length);
		console.log("--------------------------");
		removeAllElementClass("sh-predict");

		if($(".sh-hover").length == 0){
			selectorResult.addClass("sh-predict");
			var different_count = Math.abs(currentSelected.length - selectorResult.length);
			if(different_count < current_best_different){
				current_best_different = different_count;
				current_best_solution = selector;
			}
		}
			
		

		return currentSelected.length == selectorResult.length;

		// if (currentSelected.length != selectorResult.length){

		// 	return false;
		// }

		// // for(var i = 0 ; i < currentSelected ; i++ ){
		// // 	if (selectorResult[i] != currentSelected[i]){
		// // 		return false;
		// // 	}
		// // }
		// return true;
		
	}
	function removeAllElementClass(className){
		$("."+className).removeClass(className);
	}

    $.fn.extend({
        getFullPathName: function(stopAtBody){
            stopAtBody = stopAtBody || false;
            function traverseUp(el){
                var result = el.tagName,
                    pare = $(el).parent()[0];
                if (pare.tagName !== undefined && (!stopAtBody || pare.tagName !== 'BODY')){
                    result = [traverseUp(pare), result].join(' ');
                }                
                return result;
            };
            return this.length > 0 ? traverseUp(this[0]) : '';
        }
    });
});
