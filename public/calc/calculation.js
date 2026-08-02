let autoChangeFlag = false;

$(document).ready(function () {
    let str = '<div class="condition">';
    $.each(labelList2, function (i, list) {
        if (i == 0) {
            str += '<table>'
        }
        str += '<tr><th>' + list[0] + '</th><td><select>';
        $.each(list[1], function (j, label) {
            str += '<option value="' + j + '">' + label + '</option>';
        });
        str += '</select></td></tr>';

        if (i == 0) {
            str += '</table><table>'
        }
    });
    str += '</table></div><div class="image"></div>';
    $('#kitaichiCalculationTool2').prepend(str);

    $('.condition').change( function() {
        controlSection();
    });
    $('[name="section"]').change( function() {
        autoChangeFlag = false;
    });

    $('#kitaichiCalculationTool2 select').change(function () {
        calcKitaichi();
    });

    calcKitaichi();
    controlSection();
	
    // プルダウン部分にもスクロールイベントを追加
    $('#kitaichiCalculationTool2 .condition [class^="scroll-link"]').each(function () {
        $(this).click(function () {
            scrollToElement($(this))
        });
    });
});

const kashiKokan = ['100', '200', '500'];
// 貸し枚数、交換枚数のリストを46から70の1枚刻み、100枚、200枚、500枚で設定
for (let i = 70; i >= 46; i--) {
    kashiKokan.unshift(i.toString(10));
}

const GamePitch = 50;
const CoinPitch = 50;

$.each(kashiKokan, function (index, value) {
    $('#kashi').append('<option value="' + value + '">' + value + '</option>');
    $('#kokan').append('<option value="' + value + '">' + value + '</option>');
});

if (parseInt(localStorage.medal)) {
    $('#medal').val(localStorage.medal);
} else {
    $('#medal').val('460');
}

if (parseInt(localStorage.kashi)) {
    $('#kashi').val(localStorage.kashi);
} else {
    $('#kashi').val('50');
}
if (parseInt(localStorage.kokan)) {
    $('#kokan').val(localStorage.kokan);
} else {
    $('#kokan').val('50');
}

$(document).ready(function () {
    if ($('#condition tr').length == 3 || $('#condition tr').length == 4) {
        $('#condition tr:eq(-2) td').css('border-bottom', 'none');
        $('#condition tr:eq(-2)').after('<tr><td colspan="2" class="bg-white" style="border-top:none;"><div class="rate-button"><button onclick="setRate(0)">等価</button><button onclick="setRate(1)">46-52</button><button onclick="setRate(2)">50-56</button></div></td></tr>');
        $('#condition tr:eq(-4) td:eq(0)').attr('rowspan', 3);
    }
    $('#hosokuWrap').append($('#hosoku-list'));
    $('#condition input, #condition select').change(function () {
        calcKitaichi();
    });

    $('#medal').focus(function() {
        this.select();
    });

    //$('#distributionWrap > h4').html('<img src="https://slolaboratory.com/wp-content/uploads/2023/01/NEWのアイコン　2.png" style="vertical-align:middle; width:24px;"> ' + $('#distributionWrap > h4').html());
    $('#distributionWrap > h4').text('ゾーン当選率・平均出玉');

    calcKitaichi();

    $('#kitaichi2 tr:eq(0) th:eq(6)').text('サンプル数');

    if (typeof custom === "function") {
        custom();
    }

    $('#container').show();
});

function calcKitaichi() {
    const medal = $('#medal').val() || '0';
    const kashi = $('#kashi').val();
    const kokan = $('#kokan').val();
    localStorage.medal = medal;
    localStorage.kashi = kashi;
    localStorage.kokan = kokan;
    $('#error').text('');

    // 条件で絞り込み
    toggleDropdowns();

    $('#hosoku-list > li').hide();
    $('#hosoku-list > li').eq(conditionIndex[getIndex()] - 1).show();

    $('#kitaichi2 tbody tr:gt(0)').remove();
    $('#distribution tbody tr:gt(0)').remove();

    // 入力値チェック
    if (medal == '' || kashi == '' || kokan == '') {
        return;
    }

    const tableTitle = tableTitleList[getIndex()];
    $('#kitaichiCalculationTool2 .caption:eq(0)').html(tableTitle);
    $('#kitaichiCalculationTool2 .caption:eq(1)').html(tableTitle.substring(0, tableTitle.lastIndexOf(' ') !== -1 ? tableTitle.lastIndexOf(' ') : tableTitle.length));

    // 非等価では出玉率を表示しない
    $('#kitaichi2 tr').each(function() {
        if (kashi == kokan) {
            $(this).find('td:nth-child(4), th:nth-child(4)').show();
        } else {
            $(this).find('td:nth-child(4), th:nth-child(4)').hide();
        }
    });

    if (typeof tableSectionNameList !== 'undefined') {
        $('#kitaichi2 tr:eq(0) th:eq(0)').text(tableSectionNameList[getIndex()]);
		
		// 「〇〇は△△のゲーム数」の表記のうち、現在表示している期待値表の条件に合わないものを非表示
		$('#kitaichiCalculationTool2 > .hosoku').show();
		$('#kitaichiCalculationTool2 > .hosoku').each( function() {
			if ($(this).text().indexOf('※' + tableSectionNameList[getIndex()]) != 0) {
				$(this).hide();
			}
		});
    }
    if (typeof tableProbabilityNameList !== 'undefined') {
        $('#kitaichi2 tr:eq(0) th:eq(1)').html(tableProbabilityNameList[getIndex()]);
    }

    let Arr = kitaichiList[getIndex()];
    const section = $('[name="section"]:checked').val();

    const gameLength = section == '0' ? 50 : 5;

    // 期待値表部分
    $.each(Arr, function (index) {
        if (section == '0' && index > 0 && Arr[index][0] % 50 != 0) {
            return;
        }
        if (typeof Arr[index][6] === 'undefined' || Arr[index][6] == 0) {
            return;
        }

        //benefit = replayBenefit((index) * 5, medal, kashi, kokan, Arr[index][2]);
        benefit = replayBenefit(Math.round(Arr[index][0] / 5) * 5, medal, kashi, kokan, Arr[index][2]);

        const row = $('#kitaichi2 .base').clone();
        row.removeClass('base').show();
        $('#kitaichi2').append(row);

        const startGame = Arr[index][0];
        const shokajikan = Arr[index][5] / 800 * 60;
        const dedamarirsu = (1 + Arr[index][1] / (3 * Arr[index][5])) * coef1;

        const kitaichi = ((Arr[index][3] + (coef1 - 1) * (Arr[index][5] * 3 + Arr[index][1])) / kokan - Arr[index][2] / kashi) * 1000 + benefit;
        const jikyu = kitaichi * 60 / shokajikan;

        row.find('td').eq(0).html(startGame + '-');
        row.find('td').eq(1).html(Arr[index][7] == 0 ? '0' : ('1/' + Math.round(Arr[index][4] * Arr[index][6] / Arr[index][7] / coef2)));
        row.find('td').eq(2).html(Math.round(jikyu * shokajikan / 60) + '円').addClass(jikyu > 0 ? 'plus' : 'minus');
        row.find('td').eq(3).html((dedamarirsu * 100).toFixed(1) + '%').addClass(jikyu > 0 ? 'plus' : 'minus');
        row.find('td').eq(4).html(Math.round(shokajikan) + '分');
        row.find('td').eq(5).html(Math.round(jikyu) + '円').addClass(jikyu > 0 ? 'plus' : 'minus');
        row.find('td').eq(6).html(Arr[index][6]);
    });
	
	let hitCountCol;
	let sampleCountCol;
	let hitMedalCol;
	let sampleCountCoinCol;

	if (typeof hitRateTableIndex === 'undefined') {
		Arr = hitRateList[getIndex()];
		hitCountCol = 1;
		sampleCountCol = 2;
		hitMedalCol = 3;
		sampleCountCoinCol = 4;
	} else {
		Arr = kitaichiList[hitRateTableIndex[getIndex()] - 1];
		hitCountCol = 10;
		sampleCountCol = 11;
		hitMedalCol = 12;
		sampleCountCoinCol = 13;
	}

    if (! Arr) {
        $('#distributionWrap').hide();
        return;
    }
    $('#distributionWrap').show();
    
    let totalMedalCount = 0;
    let totalHitCount = 0;

    // 当選分布部分
    for (let index = 0; index < Arr.length; index++) {
        let hitCount = Arr[index][hitCountCol];
        let sampleCount = Arr[index][sampleCountCol];
        let hitRate = hitCount / sampleCount;
        let hitMedal = Arr[index][hitMedalCol];
        let tmpIndex = index;

        if (typeof sampleCount === 'undefined' || sampleCount == 0) {
            continue;
        }

        if (section == '0') {
            var hitCountSum = 0;
            var medalCountSum = 0;
            var sampleCountSum = 0;
            do {
                hitCountSum += Arr[tmpIndex][hitCountCol];
                medalCountSum += Arr[tmpIndex][hitMedalCol] * Arr[tmpIndex][sampleCountCoinCol];
                sampleCountSum += Arr[tmpIndex][sampleCountCoinCol];
                tmpIndex++;
            } while (Arr[tmpIndex] && Arr[tmpIndex][0] % 50 != 0);
            tmpIndex--;
            hitRate = hitCountSum / sampleCount;
            hitMedal = Math.round(medalCountSum / sampleCountSum) || 0;
            // サンプル数用
            hitCount = hitCountSum;
        }

        totalMedalCount += hitMedal * hitCount;
        totalHitCount += hitCount;

        const row = $('#distribution .base').clone();
        row.removeClass('base').show();
        $('#distribution').append(row);

        const minGame = Arr[index][0] + 1;
        const maxGame = Math.floor((minGame + gameLength) / gameLength) * gameLength;
        row.find('td').eq(0).text(minGame + '-' + maxGame);
        row.find('td').eq(1).text((hitRate * 100).toFixed(1) + '%');

        const barWidth = Math.min(hitRate * 100 / graphMax[0][section], 100) + '%';
        row.find('.bar1').width(barWidth);
        const barWidth2 = Math.min(hitMedal * 100 / graphMax[1][section], 100) + '%';
        row.find('.bar2').width(barWidth2);

        if (hitRate / graphMax[0][section] >= 1) {
            row.find('.bar1').addClass('over-limit');
        }
        if (hitMedal / graphMax[1][section] >= 1) {
            row.find('.bar2').addClass('over-limit');
        }
        row.find('td').eq(3).text(Math.round(hitMedal) + '枚');
        row.find('td').eq(5).text(hitCount);
        index = tmpIndex;
    }

    const row = $('#distribution .base').clone();
    row.removeClass('base').show();
    $('#distribution').append(row);
    row.find('td').eq(0).text('計');
    row.find('.bar1').width('0%');
    row.find('td').eq(3).text(Math.round(totalMedalCount / totalHitCount) + '枚');
    const barWidth2 = Math.min(totalMedalCount / totalHitCount * 100 / graphMax[1][section], 100) + '%';
    row.find('.bar2').width(barWidth2);
    row.find('td').eq(5).text(totalHitCount);
}

function replayBenefit(StartGame, RepLimit, Kashi, Kokan, Toshi_Ave) {
    if (typeof inList === 'undefined') {
        $('#medal').closest('tr').hide();
        return 0;
    }
    const Arr = inList[getIndex()];
    if (Arr.length == 0) {
        $('#medal').closest('tr').hide();
        return 0;
    }
    $('#medal').closest('tr').show();
    if (RepLimit == 0 || Kashi == Kokan) {
        return 0;
    }
	
	RepLimit = Math.min(RepLimit, 10000);

    const Rows = Arr.length;
    const Clms = Arr[1].length;
    let Toshi_Coin = 0;
    let Toshi_Cash = 0;
    for (i = 2; i <= Rows - 1; i++) {
        if (Arr[i - 1][0] == StartGame) {
            // 件数が0件だったら0を返す
            if (Arr[i - 1][Clms-2] == 0) {
                return 0;
            }
            for (j = 2; j <= Math.floor(RepLimit / CoinPitch + 1.5); j++) {
                Toshi_Coin = Toshi_Coin + (((Arr[0][j - 1] - CoinPitch / 2) * Arr[i - 1][j - 1]) || 0);
            }
            for (j = j; j <= Clms - 2; j++) {
                Toshi_Coin = Toshi_Coin + RepLimit * (Arr[i - 1][j - 1] || 0);
                Toshi_Cash = Toshi_Cash + (((Arr[0][j - 1] - CoinPitch / 2 - RepLimit) * Arr[i - 1][j - 1]) || 0);
            }
            break;
        }
    }
    return ((Arr[i - 1][Clms - 1] / Kashi - (Toshi_Coin / Kokan + Toshi_Cash / Kashi) / Arr[i - 1][Clms - 2]) * 1000) || 0;
}

function getIndex() {
    let condition = [];
    $.each($('.condition tr'), function (index, elem) {
        if ($(elem).hasClass('not-use')) {
            condition.push('');
        } else {
            condition.push($(elem).find('select').val());
        }
    });
    return conversion.indexOf(condition.join(','));
}

function addNotUse(...num) {
    for (const item of num) {
        $('.condition tr').eq(item).addClass('not-use');
    }
}

function controlSection() {
    Arr = kitaichiList[getIndex()];
    if (Arr.filter(row => row[7] > 0).length <= 70) {
        if ($('[name="section"]:checked').val() == '0') {
            $('[name="section"][value="1"]').prop('checked', true).change();
            autoChangeFlag = true;
        }
    } else {
        if (autoChangeFlag) {
            $('[name="section"][value="0"]').prop('checked', true).change();
        }
    }
}

const rateMaster = [
	[50, 50],
	[46, 52],
	[50, 56]
];

function setRate(index) {
    setRatePulldown(index);
	
	// 50-56のタブが無かったら46-52に切り替える
    const hasThirdTab = $('.tab-group[data-tab-name="rate"]').first().children('.tab-label').children().length > 2;

    const tabIndex = index === 2 && !hasThirdTab ? 1 : index;
	setTab('rate', tabIndex);
}
function setRatePulldown(index) {
    $('#kashi').val(rateMaster[index][0]);
    $('#kokan').val(rateMaster[index][1]);
    calcKitaichi();
}