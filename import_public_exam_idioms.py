# -*- coding: utf-8 -*-
"""
Import high-frequency public-exam idioms into MySQL.

Default database:
  host: 127.0.0.1
  port: 3306
  database: idiom
  user: root
  password: root

Usage:
  python import_public_exam_idioms.py
  python import_public_exam_idioms.py --dry-run
  python import_public_exam_idioms.py --source-url "https://example.com/page.html"
"""

from __future__ import annotations

import argparse
import json
import re
import sys
import time
from collections import defaultdict, deque
from dataclasses import dataclass, field
from typing import Iterable
from urllib.parse import quote, urldefrag, urljoin, urlparse

try:
    import pymysql
    import requests
    from bs4 import BeautifulSoup
except ImportError as exc:
    missing = exc.name or "dependency"
    print(
        f"缺少依赖：{missing}\n"
        "请先执行：python -m pip install -r requirements.txt",
        file=sys.stderr,
    )
    raise


SEED_IDIOMS_RAW = """
大相径庭（考频 38 次）
天马行空（考频 36 次）
层出不穷（考频 35 次）
南辕北辙（考频 35 次）
相得益彰（考频 33 次）
相辅相成（考频 33 次）
推陈出新（考频 30 次）
一蹴而就（考频 29 次）
未雨绸缪（考频 29 次）
司空见惯（考频 28 次）
独树一帜（考频 28 次）
有的放矢（考频 28 次）
历久弥新（考频 28 次）
日新月异（考频 27 次）
理所当然（考频 27 次）
举足轻重（考频 27 次）
水到渠成（考频 26 次）
不言而喻（考频 26 次）
毋庸置疑（考频 25 次）
一成不变（考频 24 次）
标新立异（考频 24 次）
源远流长（考频 24 次）
与时俱进（考频 24 次）
一劳永逸（考频 24 次）
方兴未艾（考频 23 次）
人云亦云（考频 23 次）
不可或缺（考频 23 次）
持之以恒（考频 23 次）
有目共睹（考频 22 次）
背道而驰（考频 22 次）
轻而易举（考频 22 次）
脱颖而出（考频 22 次）
无与伦比（考频 22 次）
潜移默化（考频 21 次）
根深蒂固（考频 21 次）
缘木求鱼（考频 21 次）
莫衷一是（考频 21 次）
应运而生（考频 21 次）
显而易见（考频 21 次）
薪火相传（考频 21 次）
一脉相承（考频 21 次）
栩栩如生（考频 20 次）
独一无二（考频 20 次）
此起彼伏（考频 20 次）
比比皆是（考频 19 次）
如火如荼（考频 19 次）
浮光掠影（考频 19 次）
迫在眉睫（考频 19 次）
纸上谈兵（考频 19 次）
循序渐进（考频 19 次）
屡见不鲜（考频 19 次）
捉襟见肘（考频 18 次）
良莠不齐（考频 18 次）
无可厚非（考频 18 次）
因势利导（考频 18 次）
休戚与共（考频 18 次）
惟妙惟肖（考频 18 次）
此消彼长（考频 18 次）
顾此失彼（考频 18 次）
走马观花（考频 18 次）
精益求精（考频 18 次）
叹为观止（考频 18 次）
不胜枚举（考频 17 次）
循规蹈矩（考频 17 次）
立竿见影（考频 17 次）
纷至沓来（考频 17 次）
凤毛麟角（考频 17 次）
眼花缭乱（考频 17 次）
一日千里（考频 17 次）
随波逐流（考频 17 次）
墨守成规（考频 17 次）
急功近利（考频 17 次）
耳濡目染（考频 16 次）
汗牛充栋（考频 16 次）
按部就班（考频 16 次）
因地制宜（考频 16 次）
固步自封（考频 16 次）
如出一辙（考频 16 次）
习以为常（考频 16 次）
适得其反（考频 16 次）
顺理成章（考频 16 次）
浩如烟海（考频 16 次）
责无旁贷（考频 16 次）
革故鼎新（考频 16 次）
另辟蹊径（考频 16 次）
刻舟求剑（考频 16 次）
各有千秋（考频 15 次）
崭露头角（考频 15 次）
不谋而合（考频 15 次）
削足适履（考频 15 次）
交相辉映（考频 15 次）
风起云涌（考频 15 次）
浅尝辄止（考频 15 次）
因循守旧（考频 15 次）
引人入胜（考频 15 次）
包罗万象（考频 15 次）
舍本逐末（考频 15 次）
一以贯之（考频 15 次）
博大精深（考频 14 次）
亦步亦趋（考频 14 次）
脍炙人口（考频 14 次）
振聋发聩（考频 14 次）
望尘莫及（考频 14 次）
瞻前顾后（考频 14 次）
喜闻乐见（考频 14 次）
泾渭分明（考频 14 次）
置若罔闻（考频 14 次）
琳琅满目（考频 14 次）
接踵而至（考频 14 次）
一如既往（考频 14 次）
昙花一现（考频 14 次）
好高骛远（考频 14 次）
如影随形（考频 14 次）
矢志不渝（考频 14 次）
融会贯通（考频 14 次）
居安思危（考频 14 次）
因噎废食（考频 14 次）
一枕黄粱（考频 14 次）
各有千秋（考频 14 次）
束手无策（考频 14 次）
"""


DEFAULT_SOURCE_URLS = [
    "https://www.cnblogs.com/huangjiale/p/17960902",
    "https://edu.sina.com.cn/official/2014-08-22/1103431497.shtml",
    "https://edu.sina.com.cn/official/2012-04-01/1516333239.shtml",
    "http://www.chinagwy.org",
    "http://m.chinagwy.org/html/xczl/yy/202407/47_640536.html",
    "https://gongwuyuan.eol.cn",
    "https://www.fenbi.com",
    "https://www.offcn.com",
    "https://www.huatu.com",
    "https://saduck.top/",
    "https://www.saduck.top/%E7%94%B3%E8%AE%BA/%E7%94%B3%E8%AE%BA%E8%A7%84%E8%8C%83%E8%AF%8D.html",
    "https://m.book118.com/html/2026/0303/5112103121013130.shtm",
    "https://m.book118.com/html/2026/0322/8040025074010055.shtm",
    "http://www.scs.gov.cn",
    "http://bm.scs.gov.cn/kl2026",
    "https://www.chinagwy.org",
    "https://www.gwyzk.com",
    "https://www.chinaexam.org",
    "https://www.shiyebian.net",
    "https://www.qgzks.com",
    "https://opinion.people.com.cn",
    "https://www.banyuetan.org",
    "https://www.xuexi.cn",
    "https://www.qstheory.cn",
    "https://www.gmw.cn",
    "https://wenku.baidu.com",
    "https://www.zhihu.com",
]


LINK_KEYWORDS = (
    "成语",
    "言语",
    "行测",
    "申论",
    "规范词",
    "高频",
    "易错",
    "词语",
    "公考",
    "公务员",
    "国家公务员",
    "xczl",
    "yy",
    "sl",
)

SKIP_URL_PARTS = (
    "login",
    "register",
    "passport",
    "user",
    "comment",
    "video",
    "photo",
    "javascript:",
    "mailto:",
    "#",
)


FALLBACK_EXPLANATIONS = {
    "大相径庭": "形容彼此相差很远或矛盾很大。",
    "天马行空": "比喻才思奔放、不受拘束；也可指言行不切实际。",
    "层出不穷": "接连不断地出现，没有穷尽。",
    "南辕北辙": "行动和目的相反，方向完全不一致。",
    "相得益彰": "互相配合、互相衬托，使双方优点更加明显。",
    "相辅相成": "互相辅助、互相促成，缺一不可。",
    "推陈出新": "去掉旧事物的糟粕，吸收精华，创造新的东西。",
    "一蹴而就": "踏一步就成功，比喻事情轻而易举、一下子完成。",
    "未雨绸缪": "比喻事先做好准备，防患于未然。",
    "司空见惯": "指某事常见，不足为奇。",
    "独树一帜": "比喻自成一家，风格或主张独特。",
    "有的放矢": "比喻说话做事目标明确，有针对性。",
    "历久弥新": "经历很长时间反而更加鲜活、更有价值。",
    "日新月异": "每天每月都有新的变化，形容发展进步很快。",
    "理所当然": "从道理上说应当如此。",
    "举足轻重": "地位重要，一举一动都足以影响全局。",
    "水到渠成": "条件成熟后事情自然成功。",
    "不言而喻": "不用说明就可以明白。",
    "毋庸置疑": "事实明显或理由充分，不需要怀疑。",
    "一成不变": "一经形成就不再改变，常指守旧僵化。",
    "标新立异": "提出新奇的主张或见解，以显示与众不同。",
    "源远流长": "源头很远，流程很长；比喻历史悠久、根基深厚。",
    "与时俱进": "随着时代发展而不断进步、更新。",
    "一劳永逸": "辛苦一次把事情办好，以后不再费力。",
    "方兴未艾": "事物正在兴起、发展，一时不会终止。",
    "人云亦云": "别人怎么说自己也跟着怎么说，没有主见。",
    "不可或缺": "非常重要，不能缺少。",
    "持之以恒": "长久坚持下去，不间断。",
    "有目共睹": "大家都能看见，形容事实非常明显。",
    "背道而驰": "朝相反方向走，比喻方向、目标完全相反。",
    "轻而易举": "形容事情容易做，不费力。",
    "脱颖而出": "比喻人的才能全部显露出来。",
    "无与伦比": "没有能比得上的，形容非常突出。",
    "潜移默化": "人的思想、性格在不知不觉中受到影响而发生变化。",
    "根深蒂固": "基础深厚，不易动摇。",
    "缘木求鱼": "爬到树上去找鱼，比喻方向方法错误，达不到目的。",
    "莫衷一是": "意见分歧，不能得出一致结论。",
    "应运而生": "顺应时机或需要而产生。",
    "显而易见": "事情或道理很明显，容易看出来。",
    "薪火相传": "比喻学问、技艺、精神等代代传承。",
    "一脉相承": "从同一源流传承下来，前后连续不断。",
    "栩栩如生": "形象逼真，好像活的一样。",
    "独一无二": "只有这一个，没有相同的或可相比的。",
    "此起彼伏": "这里起来，那里落下，形容连续不断。",
    "比比皆是": "到处都是，形容极其常见。",
    "如火如荼": "形容气势旺盛、场面热烈。",
    "浮光掠影": "比喻观察不细致，印象不深刻。",
    "迫在眉睫": "事情临近眼前，形势十分紧迫。",
    "纸上谈兵": "比喻空谈理论，不能解决实际问题。",
    "循序渐进": "按照一定步骤逐渐深入或提高。",
    "屡见不鲜": "经常看见，并不新奇。",
    "捉襟见肘": "拉一下衣襟就露出胳膊肘，比喻顾此失彼、穷于应付。",
    "良莠不齐": "好人坏人混杂在一起，也指质量好坏不一。",
    "无可厚非": "不能过分责备，表示虽有缺点但可以理解。",
    "因势利导": "顺着事物发展的趋势加以引导。",
    "休戚与共": "忧喜、祸福共同承受，关系密切。",
    "惟妙惟肖": "描写或模仿得非常逼真。",
    "此消彼长": "这个下降，那个上升。",
    "顾此失彼": "顾了这个，丢了那个，形容不能全面照顾。",
    "走马观花": "比喻粗略地观察事物。",
    "精益求精": "已经很好还要求更好。",
    "叹为观止": "赞美所见事物好到极点。",
    "不胜枚举": "数量太多，无法一一列举。",
    "循规蹈矩": "遵守规矩，不敢越出常规。",
    "立竿见影": "比喻收效非常迅速。",
    "纷至沓来": "接连不断地到来。",
    "凤毛麟角": "比喻稀少而珍贵的人或事物。",
    "眼花缭乱": "眼睛看见复杂纷繁的东西而感到迷乱。",
    "一日千里": "形容进展或发展非常迅速。",
    "随波逐流": "随着潮流走，缺乏主见。",
    "墨守成规": "拘泥于旧规矩，不肯改进。",
    "急功近利": "急于求成，贪图眼前利益。",
    "耳濡目染": "经常听到看到，长期受到影响。",
    "汗牛充栋": "形容书籍极多。",
    "按部就班": "按照一定步骤和次序进行。",
    "因地制宜": "根据不同地区的具体情况采取合适办法。",
    "固步自封": "比喻守着老一套，不求进步。",
    "如出一辙": "像出自同一个车辙，比喻两件事情非常相似。",
    "习以为常": "经常如此，就觉得平常。",
    "适得其反": "结果正好与愿望相反。",
    "顺理成章": "合乎情理，自然形成某种结果。",
    "浩如烟海": "形容文献、资料等极其丰富。",
    "责无旁贷": "责任不能推卸给别人。",
    "革故鼎新": "除去旧的，建立新的。",
    "另辟蹊径": "另外开辟一条道路，比喻另创一种新方法。",
    "刻舟求剑": "比喻拘泥成法，不懂得随着情况变化处理问题。",
    "各有千秋": "各有各的长处或特色。",
    "崭露头角": "比喻初显才能或本领。",
    "不谋而合": "事先没有商量而意见或行动完全一致。",
    "削足适履": "比喻不合理地迁就现成条件，生硬凑合。",
    "交相辉映": "各种光亮、色彩等互相映照。",
    "风起云涌": "形容事物迅速发展，声势浩大。",
    "浅尝辄止": "稍微尝试一下就停止，比喻学习研究不深入。",
    "因循守旧": "沿袭旧规，不思改革。",
    "引人入胜": "吸引人进入美妙境地，常形容景物或作品很吸引人。",
    "包罗万象": "内容丰富，应有尽有。",
    "舍本逐末": "舍弃根本的、主要的，追求枝节的、次要的。",
    "一以贯之": "用一个根本性的道理贯穿始终。",
    "博大精深": "思想、学问等广博高深。",
    "亦步亦趋": "比喻自己没有主张，处处模仿或追随别人。",
    "脍炙人口": "比喻好的诗文或事物被人们称赞和传诵。",
    "振聋发聩": "比喻言论深刻有力，使糊涂麻木的人清醒。",
    "望尘莫及": "只望见前面扬起的尘土而追不上，比喻远远落后。",
    "瞻前顾后": "看看前面又看看后面，形容顾虑太多、犹豫不决。",
    "喜闻乐见": "喜欢听，乐意看，形容很受欢迎。",
    "泾渭分明": "比喻界限清楚或是非分明。",
    "置若罔闻": "放在一边，好像没有听见，形容不予理会。",
    "琳琅满目": "形容美好的事物很多。",
    "接踵而至": "一个接一个到来。",
    "一如既往": "完全像过去一样。",
    "昙花一现": "比喻美好事物或现象出现一下很快消失。",
    "好高骛远": "不切实际地追求过高过远的目标。",
    "如影随形": "像影子总跟着身体，比喻两者关系密切。",
    "矢志不渝": "立下志愿决不改变。",
    "融会贯通": "把各方面知识道理融合起来，得到全面透彻的理解。",
    "居安思危": "处在安定环境中也想到可能出现的危险。",
    "因噎废食": "比喻因为小的挫折或问题就停止该做的事。",
    "一枕黄粱": "比喻虚幻不能实现的梦想。",
    "束手无策": "像手被捆住一样没有办法。",
}


STOP_WORDS = {
    "公务员考试",
    "言语理解",
    "高频成语",
    "成语辨析",
    "华图教育",
    "新浪教育",
    "原标题",
    "点击查看",
    "相关阅读",
    "上一篇",
    "下一篇",
    "返回首页",
    "手机用户",
    "更多内容",
    "中国网",
    "人民网",
    "新华网",
}


@dataclass
class IdiomRecord:
    word: str
    frequency: int
    exact_frequency: int | None = None
    min_frequency: int = 5
    explanation: str = ""
    source_type: str = "seed"
    frequency_basis: str = "exact_exam_frequency"
    confidence: float = 0.5
    occurrence_count: int = 1
    source_site_count: int = 0
    reliability_level: str = "C"
    priority_score: float = 0.0
    source_urls: set[str] = field(default_factory=set)
    raw_context: str = ""


def clean_text(value: str) -> str:
    value = re.sub(r"\s+", " ", value or "").strip()
    value = value.strip("；;，,。 .")
    return value


def is_probable_idiom(word: str) -> bool:
    return (
        bool(re.fullmatch(r"[\u4e00-\u9fff]{2,8}", word))
        and word not in STOP_WORDS
    )


def source_site(url: str) -> str:
    host = urlparse(url).netloc.lower()
    for prefix in ("www.", "m."):
        if host.startswith(prefix):
            host = host[len(prefix) :]
    return host


def looks_like_explanation(word: str, explanation: str, url: str) -> bool:
    if len(explanation) < 6:
        return False
    if re.search(r"点击|登录|注册|评论|收藏|转载|责任编辑|广告|报名入口|课程|客服", explanation):
        return False
    if "规范词" in url or "申论" in url:
        return True
    return bool(
        re.search(
            r"比喻|形容|原指|现指|多指|泛指|指[的是]?|意思是|意为|表示|用来|用于|强调|侧重|侧重于",
            explanation,
        )
    )


def parse_seed_records() -> list[IdiomRecord]:
    records: list[IdiomRecord] = []
    pattern = re.compile(r"^\s*(?P<word>[\u4e00-\u9fff]{4,8})（考频\s*(?P<freq>\d+)\s*次）")
    for line in SEED_IDIOMS_RAW.splitlines():
        match = pattern.search(line)
        if not match:
            continue
        records.append(
            IdiomRecord(
                word=match.group("word"),
                frequency=int(match.group("freq")),
                exact_frequency=int(match.group("freq")),
                min_frequency=int(match.group("freq")),
                source_type="provided_seed",
                frequency_basis="exact_exam_frequency_from_user",
                confidence=1.0,
                raw_context=line.strip(),
            )
        )
    return records


def fetch_html(url: str, timeout: int = 20) -> str:
    headers = {
        "User-Agent": (
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
            "AppleWebKit/537.36 (KHTML, like Gecko) "
            "Chrome/124.0 Safari/537.36"
        )
    }
    response = requests.get(url, headers=headers, timeout=timeout)
    response.raise_for_status()
    response.encoding = response.apparent_encoding or response.encoding
    return response.text


def soup_text_lines(html: str) -> list[str]:
    soup = BeautifulSoup(html, "html.parser")
    for tag in soup(["script", "style", "noscript"]):
        tag.decompose()
    lines = []
    for line in soup.get_text("\n").splitlines():
        line = clean_text(line)
        if line:
            lines.append(line)
    return lines


def normalize_url(url: str) -> str:
    url = clean_text(url).strip("，,；;")
    if not url or "可疑链接" in url:
        return ""
    parsed = urlparse(url if re.match(r"^https?://", url) else f"https://{url}")
    if not parsed.netloc:
        return ""
    normalized, _ = urldefrag(parsed.geturl())
    return normalized.rstrip("/")


def should_follow_link(url: str, link_text: str, root_host: str) -> bool:
    normalized = normalize_url(url)
    if not normalized:
        return False
    parsed = urlparse(normalized)
    if parsed.scheme not in {"http", "https"}:
        return False
    if parsed.netloc.lower() != root_host.lower():
        return False
    lowered = (normalized + " " + link_text).lower()
    if any(part in lowered for part in SKIP_URL_PARTS):
        return False
    return any(keyword.lower() in lowered for keyword in LINK_KEYWORDS)


def discover_urls_from_page(html: str, base_url: str, root_host: str) -> list[str]:
    soup = BeautifulSoup(html, "html.parser")
    found: list[str] = []
    for anchor in soup.find_all("a", href=True):
        href = urljoin(base_url, anchor.get("href", ""))
        text = clean_text(anchor.get_text(" "))
        if should_follow_link(href, text, root_host):
            found.append(normalize_url(href))
    return [url for url in dict.fromkeys(found) if url]


def crawl_related_pages(
    seed_urls: Iterable[str],
    max_pages_per_site: int,
    max_depth: int,
    delay_seconds: float,
) -> list[tuple[str, str]]:
    """Return fetched (url, html) pairs for seed URLs and related same-site pages."""
    by_host: dict[str, list[str]] = defaultdict(list)
    for raw_url in seed_urls:
        for part in re.split(r"[,，\s]+", raw_url):
            url = normalize_url(part)
            if not url:
                continue
            by_host[urlparse(url).netloc.lower()].append(url)

    fetched_pages: list[tuple[str, str]] = []
    for host, host_seeds in by_host.items():
        queue = deque((url, 0) for url in dict.fromkeys(host_seeds))
        seen: set[str] = set()
        fetched_for_host = 0

        while queue and fetched_for_host < max_pages_per_site:
            url, depth = queue.popleft()
            if url in seen:
                continue
            seen.add(url)

            print(f"[爬取] {url}")
            try:
                html = fetch_html(url)
            except requests.RequestException as exc:
                print(f"[跳过] {url}：{exc}", file=sys.stderr)
                continue

            fetched_pages.append((url, html))
            fetched_for_host += 1
            if delay_seconds > 0:
                time.sleep(delay_seconds)

            if depth >= max_depth:
                continue
            for link in discover_urls_from_page(html, url, host):
                if link not in seen and len(queue) < max_pages_per_site * 3:
                    queue.append((link, depth + 1))

    return fetched_pages


def parse_records_from_html(
    html: str,
    url: str,
    min_frequency: int,
    trust_high_frequency_pages: bool,
) -> list[IdiomRecord]:
    records: list[IdiomRecord] = []
    lines = soup_text_lines(html)
    page_text = "\n".join(lines)
    high_frequency_context = any(keyword in page_text for keyword in LINK_KEYWORDS)

    explicit_freq_patterns = [
        re.compile(r"(?P<word>[\u4e00-\u9fff]{2,8})[（(]\s*考频\s*(?P<freq>\d+)\s*次\s*[)）]"),
        re.compile(r"(?P<word>[\u4e00-\u9fff]{2,8}).{0,8}(?:出现|考查|考察|命中)\s*(?P<freq>\d+)\s*次"),
    ]
    definition_line = re.compile(
        r"^(?:\d+[\s、.．]*)?[“\"']?(?P<word>[\u4e00-\u9fff]{2,8})[”\"']?\s*[：:]\s*(?P<explanation>.+)$"
    )
    loose_definition_line = re.compile(
        r"^(?:\d+[\s、.．]*)?[“\"']?(?P<word>[\u4e00-\u9fff]{2,8})[”\"']?\s+(?P<explanation>(?:比喻|形容|指|指的是|用来|表示|意为|意思是).+)$"
    )

    for line in lines:
        for explicit_freq in explicit_freq_patterns:
            for match in explicit_freq.finditer(line):
                word = match.group("word")
                frequency = int(match.group("freq"))
                if frequency < min_frequency or not is_probable_idiom(word):
                    continue
                explanation = ""
                tail = clean_text(line[match.end() :])
                if tail.startswith(("：", ":")):
                    explanation = clean_text(tail[1:])
                records.append(
                    IdiomRecord(
                        word=word,
                        frequency=frequency,
                        exact_frequency=frequency,
                        min_frequency=frequency,
                        explanation=explanation,
                        source_type="scraped",
                        frequency_basis="exact_exam_frequency_from_page",
                        confidence=0.95,
                        source_urls={url},
                        raw_context=line[:500],
                    )
                )

        match = definition_line.match(line) or loose_definition_line.match(line)
        if not match:
            continue
        word = match.group("word")
        explanation = clean_text(match.group("explanation"))
        if not is_probable_idiom(word) or len(explanation) < 4:
            continue
        if not looks_like_explanation(word, explanation, url):
            continue

        frequency = min_frequency
        basis = "high_frequency_candidate_no_exact_exam_count"
        if not trust_high_frequency_pages or not high_frequency_context:
            continue
        records.append(
            IdiomRecord(
                word=word,
                frequency=frequency,
                exact_frequency=None,
                min_frequency=min_frequency,
                explanation=explanation,
                source_type="scraped",
                frequency_basis=basis,
                confidence=0.45,
                source_urls={url},
                raw_context=line[:500],
            )
        )
    return records


def fetch_baidu_hanyu_explanation(word: str) -> str:
    api_url = f"https://hanyu.baidu.com/hanyu/ajax/search_list?wd={quote(word)}"
    try:
        response = requests.get(
            api_url,
            headers={"User-Agent": "Mozilla/5.0"},
            timeout=12,
        )
        response.raise_for_status()
        payload = response.json()
        for item in payload.get("ret_array", []):
            for mean in item.get("mean_list", []):
                definitions = mean.get("definition", [])
                if definitions:
                    return clean_text("；".join(definitions))[:500]
    except (requests.RequestException, json.JSONDecodeError, ValueError):
        pass

    url = f"https://hanyu.baidu.com/s?wd={quote(word)}&ptype=zici"
    try:
        html = fetch_html(url, timeout=12)
    except requests.RequestException:
        return ""

    soup = BeautifulSoup(html, "html.parser")
    candidates: list[str] = []
    selectors = [
        "#basicmean-wrapper .tab-content",
        ".tab-content",
        ".poem-detail-header + div",
    ]
    for selector in selectors:
        for node in soup.select(selector):
            text = clean_text(node.get_text(" "))
            if word in text:
                text = text.replace(word, "", 1).strip()
            if len(text) >= 6:
                candidates.append(text)

    if not candidates:
        text = clean_text(soup.get_text(" "))
        match = re.search(r"(?:释义|解释)\s*[:：]?\s*(.{8,120})", text)
        if match:
            candidates.append(clean_text(match.group(1)))

    return min(candidates, key=len)[:500] if candidates else ""


def merge_records(records: Iterable[IdiomRecord]) -> list[IdiomRecord]:
    merged: dict[str, IdiomRecord] = {}
    for record in records:
        if not is_probable_idiom(record.word):
            continue
        current = merged.get(record.word)
        if not current:
            merged[record.word] = record
            continue

        current.occurrence_count += record.occurrence_count
        if record.exact_frequency is not None:
            if current.exact_frequency is None:
                current.exact_frequency = record.exact_frequency
            else:
                current.exact_frequency = max(current.exact_frequency, record.exact_frequency)
        current.min_frequency = max(current.min_frequency, record.min_frequency)
        current.frequency = max(current.frequency, record.frequency)
        if len(record.explanation) > len(current.explanation):
            current.explanation = record.explanation
        if record.frequency_basis.startswith("exact"):
            current.frequency_basis = record.frequency_basis
        elif not current.frequency_basis.startswith("exact"):
            current.frequency_basis = record.frequency_basis
        current.source_urls.update(record.source_urls)
        current.source_type = ",".join(sorted(set((current.source_type + "," + record.source_type).split(","))))
        current.confidence = max(current.confidence, record.confidence)
        if len(record.raw_context) > len(current.raw_context):
            current.raw_context = record.raw_context

    for record in merged.values():
        sites = {source_site(url) for url in record.source_urls if source_site(url)}
        if not sites and record.source_type == "provided_seed":
            sites = {"user_provided"}
        record.source_site_count = len(sites)
        if record.exact_frequency is not None:
            record.reliability_level = "A"
            record.priority_score = record.exact_frequency * 10 + record.source_site_count * 2
            record.confidence = max(record.confidence, 1.0)
        elif record.source_site_count >= 2:
            record.reliability_level = "B"
            record.priority_score = record.min_frequency * 10 + record.source_site_count * 6 + record.occurrence_count
            record.confidence = max(record.confidence, min(0.85, 0.55 + record.source_site_count * 0.1))
        else:
            record.reliability_level = "C"
            record.priority_score = record.min_frequency * 10 + record.occurrence_count
            record.confidence = min(record.confidence, 0.55)
    return sorted(
        merged.values(),
        key=lambda item: (item.reliability_level, -item.priority_score, item.word),
    )


def enrich_missing_explanations(records: list[IdiomRecord], delay_seconds: float) -> None:
    for index, record in enumerate(records, start=1):
        if record.explanation:
            continue
        fallback = FALLBACK_EXPLANATIONS.get(record.word, "")
        if fallback:
            record.explanation = fallback
            continue
        print(f"[释义补全] {index}/{len(records)} {record.word}")
        record.explanation = fetch_baidu_hanyu_explanation(record.word)
        if delay_seconds > 0:
            time.sleep(delay_seconds)


def connect_mysql(args: argparse.Namespace, database: str | None = None):
    return pymysql.connect(
        host=args.host,
        port=args.port,
        user=args.user,
        password=args.password,
        database=database,
        charset="utf8mb4",
        autocommit=True,
        cursorclass=pymysql.cursors.DictCursor,
    )


def ensure_schema(args: argparse.Namespace) -> None:
    with connect_mysql(args) as conn:
        with conn.cursor() as cursor:
            cursor.execute(
                f"CREATE DATABASE IF NOT EXISTS `{args.database}` "
                "DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci"
            )

    with connect_mysql(args, args.database) as conn:
        with conn.cursor() as cursor:
            cursor.execute(
                f"""
                CREATE TABLE IF NOT EXISTS `{args.table}` (
                    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
                    word VARCHAR(32) NOT NULL,
                    frequency INT NOT NULL DEFAULT 5,
                    exact_frequency INT NULL,
                    min_frequency INT NOT NULL DEFAULT 5,
                    explanation TEXT NOT NULL,
                    source_type VARCHAR(128) NOT NULL DEFAULT '',
                    frequency_basis VARCHAR(128) NOT NULL DEFAULT '',
                    confidence DECIMAL(4,2) NOT NULL DEFAULT 0.50,
                    occurrence_count INT NOT NULL DEFAULT 1,
                    source_site_count INT NOT NULL DEFAULT 0,
                    reliability_level VARCHAR(8) NOT NULL DEFAULT 'C',
                    priority_score DECIMAL(8,2) NOT NULL DEFAULT 0.00,
                    source_urls TEXT NOT NULL,
                    raw_context TEXT NOT NULL,
                    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
                        ON UPDATE CURRENT_TIMESTAMP,
                    PRIMARY KEY (id),
                    UNIQUE KEY uk_word (word),
                    KEY idx_frequency (frequency),
                    KEY idx_reliability_priority (reliability_level, priority_score)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
                """
            )
            cursor.execute(f"SHOW COLUMNS FROM `{args.table}`")
            existing_columns = {row["Field"] for row in cursor.fetchall()}
            migrations = {
                "exact_frequency": f"ALTER TABLE `{args.table}` ADD COLUMN exact_frequency INT NULL AFTER frequency",
                "min_frequency": f"ALTER TABLE `{args.table}` ADD COLUMN min_frequency INT NOT NULL DEFAULT 5 AFTER exact_frequency",
                "confidence": f"ALTER TABLE `{args.table}` ADD COLUMN confidence DECIMAL(4,2) NOT NULL DEFAULT 0.50 AFTER frequency_basis",
                "occurrence_count": f"ALTER TABLE `{args.table}` ADD COLUMN occurrence_count INT NOT NULL DEFAULT 1 AFTER confidence",
                "source_site_count": f"ALTER TABLE `{args.table}` ADD COLUMN source_site_count INT NOT NULL DEFAULT 0 AFTER occurrence_count",
                "reliability_level": f"ALTER TABLE `{args.table}` ADD COLUMN reliability_level VARCHAR(8) NOT NULL DEFAULT 'C' AFTER source_site_count",
                "priority_score": f"ALTER TABLE `{args.table}` ADD COLUMN priority_score DECIMAL(8,2) NOT NULL DEFAULT 0.00 AFTER reliability_level",
            }
            for column_name, sql in migrations.items():
                if column_name not in existing_columns:
                    cursor.execute(sql)
            cursor.execute(
                f"""
                UPDATE `{args.table}`
                SET
                    exact_frequency = CASE
                        WHEN frequency_basis LIKE 'exact%%' THEN frequency
                        ELSE exact_frequency
                    END,
                    min_frequency = CASE
                        WHEN min_frequency < 5 THEN 5
                        ELSE min_frequency
                    END,
                    confidence = CASE
                        WHEN frequency_basis LIKE 'exact%%' THEN 1.00
                        WHEN frequency_basis = 'assumed_min_frequency_from_high_frequency_page' THEN 0.45
                        ELSE confidence
                    END,
                    frequency_basis = CASE
                        WHEN frequency_basis = 'assumed_min_frequency_from_high_frequency_page'
                            THEN 'high_frequency_candidate_no_exact_exam_count'
                        ELSE frequency_basis
                    END
                """
            )
            cursor.execute(
                f"""
                CREATE OR REPLACE VIEW `{args.table}_study_priority` AS
                SELECT
                    word,
                    explanation,
                    frequency,
                    exact_frequency,
                    min_frequency,
                    reliability_level,
                    confidence,
                    occurrence_count,
                    source_site_count,
                    priority_score,
                    frequency_basis,
                    source_urls
                FROM `{args.table}`
                ORDER BY
                    reliability_level ASC,
                    priority_score DESC,
                    frequency DESC,
                    word ASC
                """
            )


def upsert_records(args: argparse.Namespace, records: list[IdiomRecord]) -> int:
    sql = f"""
        INSERT INTO `{args.table}` (
            word, frequency, exact_frequency, min_frequency, explanation,
            source_type, frequency_basis, confidence, occurrence_count,
            source_site_count, reliability_level, priority_score, source_urls, raw_context
        ) VALUES (
            %(word)s, %(frequency)s, %(exact_frequency)s, %(min_frequency)s, %(explanation)s,
            %(source_type)s, %(frequency_basis)s, %(confidence)s, %(occurrence_count)s,
            %(source_site_count)s, %(reliability_level)s, %(priority_score)s, %(source_urls)s, %(raw_context)s
        )
        ON DUPLICATE KEY UPDATE
            frequency = GREATEST(frequency, VALUES(frequency)),
            exact_frequency = CASE
                WHEN VALUES(exact_frequency) IS NULL THEN exact_frequency
                WHEN exact_frequency IS NULL THEN VALUES(exact_frequency)
                ELSE GREATEST(exact_frequency, VALUES(exact_frequency))
            END,
            min_frequency = GREATEST(min_frequency, VALUES(min_frequency)),
            explanation = CASE
                WHEN VALUES(explanation) <> '' THEN VALUES(explanation)
                ELSE explanation
            END,
            source_type = VALUES(source_type),
            frequency_basis = VALUES(frequency_basis),
            confidence = GREATEST(confidence, VALUES(confidence)),
            occurrence_count = GREATEST(occurrence_count, VALUES(occurrence_count)),
            source_site_count = GREATEST(source_site_count, VALUES(source_site_count)),
            reliability_level = VALUES(reliability_level),
            priority_score = GREATEST(priority_score, VALUES(priority_score)),
            source_urls = VALUES(source_urls),
            raw_context = VALUES(raw_context),
            updated_at = CURRENT_TIMESTAMP
    """
    params = [
        {
            "word": record.word,
            "frequency": record.frequency,
            "exact_frequency": record.exact_frequency,
            "min_frequency": record.min_frequency,
            "explanation": record.explanation,
            "source_type": record.source_type,
            "frequency_basis": record.frequency_basis,
            "confidence": record.confidence,
            "occurrence_count": record.occurrence_count,
            "source_site_count": record.source_site_count,
            "reliability_level": record.reliability_level,
            "priority_score": record.priority_score,
            "source_urls": "\n".join(sorted(record.source_urls)),
            "raw_context": record.raw_context,
        }
        for record in records
    ]
    with connect_mysql(args, args.database) as conn:
        with conn.cursor() as cursor:
            cursor.executemany(sql, params)
    return len(params)


def clear_existing_records(args: argparse.Namespace) -> None:
    with connect_mysql(args, args.database) as conn:
        with conn.cursor() as cursor:
            cursor.execute(f"TRUNCATE TABLE `{args.table}`")


def collect_records(args: argparse.Namespace) -> list[IdiomRecord]:
    records: list[IdiomRecord] = parse_seed_records()
    urls = list(DEFAULT_SOURCE_URLS) + args.source_url

    fetched_pages = crawl_related_pages(
        seed_urls=dict.fromkeys(urls),
        max_pages_per_site=args.max_pages_per_site,
        max_depth=args.crawl_depth,
        delay_seconds=args.crawl_delay,
    )

    for url, html in fetched_pages:
        scraped = parse_records_from_html(
            html=html,
            url=url,
            min_frequency=args.min_frequency,
            trust_high_frequency_pages=not args.require_explicit_frequency,
        )
        print(f"[解析] {url} -> {len(scraped)} 条")
        records.extend(scraped)

    merged = merge_records(records)
    merged = [
        record
        for record in merged
        if (record.exact_frequency or record.min_frequency) >= args.min_frequency
        and (
            record.exact_frequency is not None
            or record.source_site_count >= args.candidate_min_sites
        )
    ]

    if not args.no_enrich:
        enrich_missing_explanations(merged, args.enrich_delay)

    return merged


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="导入公考高频成语到 MySQL")
    parser.add_argument("--host", default="127.0.0.1")
    parser.add_argument("--port", type=int, default=3306)
    parser.add_argument("--database", default="idiom")
    parser.add_argument("--table", default="public_exam_high_frequency_idioms")
    parser.add_argument("--user", default="root")
    parser.add_argument("--password", default="root")
    parser.add_argument("--min-frequency", type=int, default=5)
    parser.add_argument(
        "--max-pages-per-site",
        type=int,
        default=8,
        help="每个站点最多爬取的相关页面数量。",
    )
    parser.add_argument(
        "--crawl-depth",
        type=int,
        default=1,
        help="从种子页面继续发现相关链接的深度。",
    )
    parser.add_argument(
        "--crawl-delay",
        type=float,
        default=0.2,
        help="爬取页面之间的等待秒数，避免请求过快。",
    )
    parser.add_argument(
        "--candidate-min-sites",
        type=int,
        default=1,
        help="无明确考频的候选词至少需要来自几个不同站点。设为 2 会更严格。",
    )
    parser.add_argument(
        "--require-explicit-frequency",
        action="store_true",
        help="只导入网页中明确写有考频的爬取词；默认信任高频成语页并按最低考频处理。",
    )
    parser.add_argument(
        "--source-url",
        action="append",
        default=[],
        help="额外爬取源，可重复传入。",
    )
    parser.add_argument(
        "--no-enrich",
        action="store_true",
        help="不再访问百度汉语补全缺失释义。",
    )
    parser.add_argument(
        "--enrich-delay",
        type=float,
        default=0.4,
        help="补全释义时每个词之间的等待秒数，避免请求过快。",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="只打印统计结果，不写入数据库。",
    )
    parser.add_argument(
        "--replace-table",
        action="store_true",
        help="写入前清空脚本管理的目标表，避免保留旧版爬取结果。",
    )
    return parser


def main() -> int:
    args = build_parser().parse_args()
    records = collect_records(args)

    print(f"[汇总] 去重后 {len(records)} 条，最低考频阈值：{args.min_frequency}")
    missing_explanation = [record.word for record in records if not record.explanation]
    if missing_explanation:
        print(f"[提示] 仍有 {len(missing_explanation)} 条缺少释义：{', '.join(missing_explanation[:20])}")

    if args.dry_run:
        for record in records[:20]:
            exact = record.exact_frequency if record.exact_frequency is not None else "NULL"
            print(
                f"{record.word}\tfrequency={record.frequency}\t"
                f"exact_frequency={exact}\tmin_frequency={record.min_frequency}\t"
                f"level={record.reliability_level}\tsites={record.source_site_count}\t"
                f"occurrences={record.occurrence_count}\tscore={record.priority_score:.1f}\t"
                f"confidence={record.confidence:.2f}\t{record.explanation[:60]}"
            )
        return 0

    ensure_schema(args)
    if args.replace_table:
        clear_existing_records(args)
    inserted = upsert_records(args, records)
    print(f"[完成] 已写入/更新 {inserted} 条到 {args.database}.{args.table}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
