'use strict';
// General reference rules, separate from the student's curriculum and sources.
// Keep grammatical role distinct from case and case marker.
const arabic=`مرجع نحوي عام للمراجعة، وليس نصاً من كتاب الطالب:
الجملة الاسمية الأساسية: مبتدأ مرفوع وخبر مرفوع. في الجملة الفعلية ميّز الفاعل عن المبتدأ؛ الفاعل مرفوع، والمفعول به منصوب.
إنّ وأخواتها حروف ناسخة تنصب الاسم وترفع الخبر. إنّ حرف توكيد ونصب، وليست حرف جر. إنْ الشرطية تختلف عن إنّ الناسخة.
كان وأخواتها أفعال ناقصة ترفع الاسم وتنصب الخبر؛ كان فعل ماض ناقص، وليست حرفاً.
مع الفعل المبني للمجهول، الاسم المسند إليه الحدث نائب فاعل مرفوع، وليس فاعلاً أو مفعولاً به.
المثنى يرفع بالألف وينصب ويجر بالياء. الألف علامة رفع فرعية، وليست علامة أصلية؛ الضمة علامة الرفع الأصلية. النون عوض عن التنوين، وليست علامة الرفع، وتحذف في الإضافة فقط في هذه القاعدة، لا لمجرد الرفع أو النصب أو الجر. قارن: «حضر الطالبانِ» تبقى النون؛ «حضر طالبا المدرسةِ» حذفت النون للإضافة. «طالب المدرسة» مفرد، فلا يصلح مثالاً على حذف نون المثنى. لا تقل إن النون تحذف لأن المثنى مرفوع.
جمع المذكر السالم يرفع بالواو وينصب ويجر بالياء. جمع المؤنث السالم يرفع بالضمة وينصب ويجر بالكسرة.
حذف الإضافة يخص النون في المثنى وجمع المذكر السالم، وليس الواو: «جاء معلمو المدرسةِ» بقيت الواو وحذفت النون. لا تقل إن الواو تحذف للإضافة.
راجع دور الاسم بعد الفعل، لا موضعه فقط: في «حضر طالبا المدرسةِ» طالبا فاعل مرفوع بالألف، وليس مبتدأ. في «أعجبني كتابا المعلمِ» كتابا فاعل مرفوع بالألف؛ الياء مفعول به، فلا تجعل كتابا مفعولاً به منصوباً. في «شاهدت معلمَي الفصلِ» معلمَي مفعول به منصوب بالياء. الألف والياء علامتان فرعيتان للمثنى؛ العلامتان الأصليتان المقابلتان هما الضمة والفتحة.
المضاف إليه مجرور. النعت يتبع المنعوت في الإعراب والتعريف أو التنكير والجنس والعدد وفق قواعد المطابقة.
اذكر الوظيفة النحوية أولاً ثم الحالة والعلامة، وراجع توافق كل عبارة في الإجابة. لا تعمم هذه القواعد على تركيب مختلف دون فحص السياق.`;
const biology='General biology reference: An oxygen bubble contains many molecules, not one molecule. Bubble size varies, so bubbles per minute are only a rough proxy for photosynthesis; collected gas volume per unit time is more informative. Control temperature, carbon dioxide supply, plant amount and measurement duration. Mitosis normally preserves chromosome number; meiosis reduces it to half in its haploid products.';
const chemistry='General chemistry reference: Balance atom counts by multiplying each subscript by its coefficient; do not change subscripts to balance an equation. The smallest whole-number coefficients should give equal counts of each element. Amount in moles n = mass / molar mass; number of particles N = n × Avogadro constant. Finish both the calculation and requested units.';
function reference(subject){return subject==='Arabic'?arabic:subject==='Biology'?biology:subject==='Chemistry'?chemistry:''}
module.exports={reference};
