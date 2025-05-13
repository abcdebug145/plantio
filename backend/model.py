from flask import Flask, request, jsonify, render_template, send_from_directory
import os
import json
import random
from sentence_transformers import SentenceTransformer, util
import torch
import numpy as np

app = Flask(__name__)

# Thông tin cây lưỡi hổ (Sansevieria)
PLANT_INFO = {
    "tên": "Cây lưỡi hổ (Sansevieria)",
    "tên_khoa_học": "Sansevieria trifasciata",
    "họ": "Asparagaceae",
    "nguồn_gốc": "Tây Phi từ Nigeria đến Congo",
    "mô_tả": "Cây lưỡi hổ có lá thẳng đứng, cứng, mọc từ gốc. Lá có màu xanh đậm với các dải ngang màu xanh nhạt hoặc vàng.",
    "độ_ẩm_thích_hợp": "20-40%",
    "nhiệt_độ_thích_hợp": "18-27°C",
    "ánh_sáng": "ánh sáng gián tiếp đến bóng râm một phần",
    "tưới_nước": "mỗi 2-3 tuần một lần, để đất khô hoàn toàn giữa các lần tưới",
    "đất": "đất thoát nước tốt, hỗn hợp đất cây xương rồng là lý tưởng",
    "phân_bón": "phân bón loãng 1-2 lần trong mùa sinh trưởng (mùa xuân và hè)",
    "nhân_giống": "tách chồi hoặc cắt lá",
    "sâu_bệnh_phổ_biến": ["rệp sáp", "nhện đỏ", "thối rễ do tưới quá nhiều"],
    "công_dụng": [
        "Thanh lọc không khí, loại bỏ formaldehyde, benzene, trichloroethylene, xylene và toluene",
        "Tạo oxy vào ban đêm (khác với hầu hết các loài cây khác)",
        "Cây phong thủy, được cho là mang lại may mắn và năng lượng tích cực",
        "Trang trí nội thất với thiết kế hiện đại, tối giản"
    ],
    "lời_khuyên": [
        "Đây là loại cây dễ chăm sóc, rất phù hợp với người mới bắt đầu",
        "Có khả năng lọc không khí tốt",
        "Có thể sống tốt trong điều kiện ánh sáng thấp",
        "Chịu hạn tốt, tránh tưới quá nhiều nước",
        "Cần ít sự chăm sóc và có thể chịu được điều kiện khắc nghiệt",
        "Không đặt dưới ánh nắng trực tiếp mạnh vì có thể làm cháy lá",
        "Chậu cây nên có lỗ thoát nước tốt",
        "Có thể sống trong nhiều năm mà không cần thay chậu"
    ]
}

# Chuẩn bị câu hỏi-đáp mẫu
QA_PAIRS = [
    {
        "question": "Cây lưỡi hổ là gì?",
        "answer": "Cây lưỡi hổ (Sansevieria trifasciata) là một loài cây có nguồn gốc từ Tây Phi. Nó có lá thẳng đứng, cứng với màu xanh đậm và các dải ngang màu xanh nhạt hoặc vàng. Đây là một trong những loại cây nội thất phổ biến nhất do khả năng chịu điều kiện khắc nghiệt và yêu cầu bảo dưỡng thấp."
    },
    {
        "question": "Khi nào tôi nên tưới cây lưỡi hổ?",
        "answer": "Bạn nên tưới cây lưỡi hổ khi đất khô hoàn toàn, thường mỗi 2-3 tuần một lần. Trong mùa đông, có thể giảm xuống còn 1 lần/tháng. Quá nhiều nước có thể làm thối rễ, là vấn đề phổ biến nhất đối với loại cây này. Tốt nhất là tưới ít còn hơn tưới nhiều."
    },
    {
        "question": "Cây lưỡi hổ cần bao nhiêu ánh sáng?",
        "answer": "Cây lưỡi hổ thích ánh sáng gián tiếp sáng, nhưng cũng có thể chịu được điều kiện ánh sáng thấp. Nó sẽ phát triển tốt nhất trong ánh sáng gián tiếp vừa phải. Tránh ánh nắng trực tiếp kéo dài vì có thể làm cháy lá."
    },
    {
        "question": "Làm sao để nhân giống cây lưỡi hổ?",
        "answer": "Bạn có thể nhân giống cây lưỡi hổ bằng hai cách chính:\n1. Tách chồi: Khi thay chậu, bạn có thể tách các chồi con phát triển từ thân rễ chính.\n2. Cắt lá: Cắt một lá khỏe mạnh thành các đoạn dài khoảng 5-7cm, đảm bảo bạn nhớ chiều của lá (phần dưới hướng xuống đất). Cắm vào đất ẩm hoặc nước đến khi ra rễ."
    },
    {
        "question": "Tại sao lá cây lưỡi hổ của tôi bị vàng?",
        "answer": "Lá vàng ở cây lưỡi hổ thường do một trong các nguyên nhân sau:\n1. Tưới quá nhiều nước (phổ biến nhất)\n2. Ánh sáng không đủ\n3. Nhiệt độ quá thấp\n4. Sâu bệnh (hiếm gặp)\n\nHãy đảm bảo đất khô hoàn toàn giữa các lần tưới và kiểm tra hệ thống thoát nước của chậu. Nếu cây ở nơi quá tối, hãy di chuyển đến nơi có ánh sáng gián tiếp nhiều hơn."
    },
    {
        "question": "Tôi nên dùng loại đất nào cho cây lưỡi hổ?",
        "answer": "Cây lưỡi hổ thích đất thoát nước tốt. Hỗn hợp đất trồng xương rồng hoặc đất thông thường trộn với cát, đá pumice hoặc perlite với tỷ lệ 2:1 là lý tưởng. Điều quan trọng là đất không được giữ quá nhiều nước, vì rễ cây lưỡi hổ dễ bị thối nếu ngâm trong nước quá lâu."
    },
    {
        "question": "Cây lưỡi hổ có cần bón phân không?",
        "answer": "Cây lưỡi hổ không cần nhiều phân bón. Bạn có thể bón phân loãng 1-2 lần trong mùa sinh trưởng (mùa xuân và hè) với phân bón dạng lỏng pha loãng một nửa so với hướng dẫn. Không cần bón phân trong mùa đông khi cây đang trong thời kỳ ngủ nghỉ."
    },
    {
        "question": "Có nên phun sương cho cây lưỡi hổ không?",
        "answer": "Không cần phun sương cho cây lưỡi hổ. Chúng là cây sa mạc và thích môi trường khô ráo. Phun sương có thể dẫn đến bệnh nấm trên lá. Nếu bạn muốn làm sạch lá, dùng khăn ẩm lau nhẹ nhàng thỉnh thoảng là đủ."
    },
    {
        "question": "Cây lưỡi hổ có độc không?",
        "answer": "Cây lưỡi hổ được xếp vào loại nhẹ đến trung bình về độc tính nếu ăn phải, đặc biệt đối với thú cưng và trẻ nhỏ. Nó chứa saponin có thể gây kích ứng miệng, cổ họng và dạ dày, dẫn đến buồn nôn, nôn mửa hoặc tiêu chảy. Tốt nhất là đặt cây ngoài tầm với của trẻ em và thú cưng."
    },
    {
        "question": "Cây lưỡi hổ có lợi ích gì?",
        "answer": "Cây lưỡi hổ có nhiều lợi ích:\n1. Thanh lọc không khí, loại bỏ các chất độc hại như formaldehyde, benzene và trichloroethylene\n2. Chuyển đổi CO2 thành O2 vào ban đêm (khác với hầu hết các loài cây khác)\n3. Dễ chăm sóc, phù hợp với người bận rộn hoặc người mới trồng cây\n4. Sống được trong điều kiện ánh sáng thấp\n5. Được cho là mang lại may mắn và năng lượng tích cực trong phong thủy\n6. Có giá trị trang trí cao với thiết kế thẳng đứng độc đáo"
    },
    {
        "question": "Khi nào cần thay chậu cho cây lưỡi hổ?",
        "answer": "Cây lưỡi hổ phát triển khá chậm và thích môi trường chật chội, nên bạn chỉ cần thay chậu khi:\n1. Rễ bắt đầu mọc ra khỏi lỗ thoát nước\n2. Cây quá lớn và không ổn định trong chậu hiện tại\n3. Đất quá cũ (khoảng 2-3 năm)\n\nKhi thay chậu, chọn chậu lớn hơn cũ một chút (2-3cm về đường kính). Thay chậu tốt nhất vào mùa xuân hoặc đầu hè khi cây đang trong thời kỳ sinh trưởng."
    },
    {
        "question": "Làm thế nào để cây lưỡi hổ ra hoa?",
        "answer": "Cây lưỡi hổ hiếm khi ra hoa khi trồng trong nhà, nhưng không phải là không thể. Để tăng khả năng ra hoa:\n1. Đặt cây ở nơi có nhiều ánh sáng gián tiếp\n2. Chăm sóc tốt và ổn định trong nhiều năm\n3. Đảm bảo cây đủ tuổi (thường trên 3-4 năm)\n\nHoa lưỡi hổ mọc trên cành dài, có màu trắng hoặc kem, thơm nhẹ và thường xuất hiện vào mùa xuân hoặc mùa hè. Lưu ý rằng việc ra hoa đòi hỏi nhiều năng lượng từ cây, nên sau khi ra hoa, cây có thể phát triển chậm hơn một thời gian."
    },
    {
        "question": "Cây lưỡi hổ có bị sâu bệnh không?",
        "answer": "Cây lưỡi hổ khá kháng sâu bệnh, nhưng vẫn có thể gặp một số vấn đề:\n1. Rệp sáp: Xuất hiện như những đốm bông trắng nhỏ, có thể xử lý bằng cồn isopropyl\n2. Nhện đỏ: Thường xuất hiện khi không khí quá khô, tạo mạng nhện mịn dưới lá\n3. Thối rễ: Do tưới quá nhiều nước, biểu hiện bằng lá vàng và mềm nhũn ở gốc\n\nPhòng ngừa tốt nhất là tưới nước đúng cách, đặt cây ở nơi thông thoáng và kiểm tra định kỳ để phát hiện sớm các vấn đề."
    },
    {
        "question": "Cây lưỡi hổ sống được bao lâu?",
        "answer": "Với sự chăm sóc phù hợp, cây lưỡi hổ có thể sống rất lâu, từ 5-10 năm là bình thường, và có thể lên đến vài thập kỷ trong điều kiện lý tưởng. Đây là một trong những loại cây nội thất bền bỉ nhất, có thể trở thành một phần của gia đình bạn trong nhiều năm."
    },
    {
        "question": "Có nên cắt tỉa cây lưỡi hổ không?",
        "answer": "Cây lưỡi hổ không cần cắt tỉa thường xuyên, nhưng bạn có thể:\n1. Cắt bỏ lá vàng, lá bị hư hại hoặc chết\n2. Cắt những lá quá cao để kiểm soát chiều cao\n3. Cắt lá để nhân giống\n\nKhi cắt, sử dụng kéo sắc hoặc dao sạch, cắt gần sát mặt đất. Nhựa cây có thể gây kích ứng da, nên tốt nhất là đeo găng tay khi cắt tỉa."
    },
    {
        "question": "Các loại cây lưỡi hổ phổ biến?",
        "answer": "Có nhiều loại cây lưỡi hổ với đặc điểm khác nhau:\n1. Sansevieria trifasciata 'Laurentii': Loại phổ biến nhất với viền lá màu vàng\n2. Sansevieria trifasciata 'Black Gold': Có viền vàng đậm\n3. Sansevieria trifasciata 'Futura Superba': Nhỏ gọn với các dải ngang rõ ràng\n4. Sansevieria cylindrica (cây lưỡi hổ trụ): Lá hình trụ tròn thay vì phẳng\n5. Sansevieria 'Moonshine': Lá màu xanh bạc nhạt\n6. Sansevieria trifasciata 'Hahnii' (Bird's Nest): Lá xếp thành hình tổ chim, rất nhỏ gọn\n\nTất cả đều có yêu cầu chăm sóc tương tự, chỉ khác về hình dáng và màu sắc."
    }
]

# Tạo hoặc sử dụng embedding model có sẵn
try:
    # Tải mô hình nhỏ, chạy được trên môi trường local thông thường
    model = SentenceTransformer('paraphrase-MiniLM-L3-v2')  # ~50MB
    
    # Tính embedding cho các câu hỏi mẫu
    question_embeddings = model.encode([qa["question"] for qa in QA_PAIRS])
    print("Đã tải xong mô hình embedding!")
except Exception as e:
    # Nếu không tải được model, sử dụng phương pháp từ khóa đơn giản
    model = None
    print(f"Không thể tải mô hình embedding: {e}")
    print("Sẽ sử dụng phương pháp từ khóa đơn giản thay thế")

def get_chatbot_response(user_query):
    """Tạo phản hồi dựa trên câu hỏi của người dùng"""
    
    # Nếu có model embedding
    if model:
        # Tính embedding cho câu hỏi của người dùng
        query_embedding = model.encode(user_query)
        
        # Tìm câu hỏi tương tự nhất
        similarities = util.cos_sim(query_embedding, question_embeddings)[0]
        best_match_idx = torch.argmax(similarities).item()
        
        # Nếu độ tương tự quá thấp, trả lời chung chung
        if similarities[best_match_idx] < 0.6:
            return generate_generic_response(user_query)
            
        # Trả về câu trả lời phù hợp nhất
        answer = QA_PAIRS[best_match_idx]["answer"]
    else:
        # Phương pháp từ khóa đơn giản
        best_match = None
        best_count = 0
        
        # Tách từ khóa trong câu hỏi
        query_words = set(user_query.lower().split())
        
        for qa in QA_PAIRS:
            question_words = set(qa["question"].lower().split())
            common_words = query_words.intersection(question_words)
            if len(common_words) > best_count:
                best_count = len(common_words)
                best_match = qa
        
        # Nếu không tìm thấy câu hỏi tương tự
        if best_match is None or best_count < 2:
            return generate_generic_response(user_query)
            
        answer = best_match["answer"]
        
    return answer

def generate_generic_response(query):
    """Tạo phản hồi khi không tìm thấy câu hỏi phù hợp"""
    
    # Phát hiện từ khóa phổ biến
    if any(word in query.lower() for word in ["tưới", "nước", "khô", "ẩm"]):
        return f"Cây lưỡi hổ cần được tưới khi đất khô hoàn toàn, thường mỗi 2-3 tuần một lần. Quan trọng là không tưới quá nhiều nước vì có thể gây thối rễ. Hãy kiểm tra đất bằng cách chạm vào vài cm đầu tiên - nếu còn ẩm, hãy đợi thêm vài ngày nữa."
    
    elif any(word in query.lower() for word in ["ánh sáng", "nắng", "bóng", "tối"]):
        return f"Cây lưỡi hổ phát triển tốt nhất trong ánh sáng gián tiếp sáng, nhưng cũng có thể chịu được điều kiện ánh sáng thấp. Tránh ánh nắng trực tiếp kéo dài vì có thể làm cháy lá. Nếu lá có vệt vàng, thì cây cần nhiều ánh sáng hơn để duy trì màu sắc đó."
    
    elif any(word in query.lower() for word in ["nhân giống", "nhân", "con", "sinh sản", "tách", "cắt"]):
        return f"Bạn có thể nhân giống cây lưỡi hổ bằng cách tách chồi khi thay chậu hoặc cắt lá thành các đoạn 5-7cm và cắm vào đất ẩm. Đảm bảo giữ đúng chiều của lá (phần dưới hướng xuống đất) và đợi vài tuần đến vài tháng để rễ và chồi mới phát triển."
    
    elif any(word in query.lower() for word in ["phân", "bón", "dinh dưỡng"]):
        return f"Cây lưỡi hổ không cần nhiều phân bón. Bạn có thể bón phân loãng 1-2 lần trong mùa sinh trưởng (mùa xuân và hè). Sử dụng phân bón cân bằng pha loãng một nửa so với hướng dẫn. Không cần bón phân trong mùa đông."

    # Phản hồi mặc định
    return f"Cây lưỡi hổ (Sansevieria) là một trong những loại cây nội thất dễ chăm sóc nhất. Nó cần ít nước (2-3 tuần/lần), chịu được điều kiện ánh sáng thấp và có khả năng thanh lọc không khí. Bạn có thể hỏi tôi về cách tưới nước, loại đất, ánh sáng hoặc cách nhân giống cây lưỡi hổ."

