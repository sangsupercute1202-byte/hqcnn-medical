import torch
import torch.nn.functional as F
import numpy as np
import cv2
import base64
from io import BytesIO
from PIL import Image
import torchvision.transforms as transforms

TRANSFORM = transforms.Compose([
    transforms.Grayscale(num_output_channels=1),
    transforms.Resize((28, 28)),
    transforms.ToTensor(),
    transforms.Normalize(mean=[0.5], std=[0.5])
])

class GradCAM:
    def __init__(self, model, target_layer):
        self.model       = model
        self.gradients   = None
        self.activations = None
        target_layer.register_forward_hook(self._fwd_hook)
        target_layer.register_full_backward_hook(self._bwd_hook)

    def _fwd_hook(self, module, input, output):
        self.activations = output.detach()

    def _bwd_hook(self, module, grad_input, grad_output):
        self.gradients = grad_output[0].detach()

    def generate(self, inp):
        self.model.eval()
        inp = inp.requires_grad_(True)
        out = self.model(inp)
        self.model.zero_grad()
        out.backward(retain_graph=True)

        weights = self.gradients[0].mean(dim=(1,2))
        acts    = self.activations[0]
        cam     = torch.zeros(acts.shape[1:])
        for i, w in enumerate(weights):
            cam += w * acts[i]

        cam = F.relu(cam).numpy()
        if cam.max() > cam.min():
            cam = (cam - cam.min()) / (cam.max() - cam.min())
        else:
            cam = np.zeros_like(cam)

        cam = cv2.resize(cam, (28, 28))
        return cam, out.item()


def image_to_tensor(pil_image):
    return TRANSFORM(pil_image).unsqueeze(0)


def to_base64(pil_img):
    buf = BytesIO()
    pil_img.save(buf, format='PNG')
    return base64.b64encode(buf.getvalue()).decode('utf-8')


def run_prediction(model, image_tensor):
    target_layer = model.features[-3]
    gradcam      = GradCAM(model, target_layer)
    cam, prob    = gradcam.generate(image_tensor)

    pred_class = 1 if prob >= 0.5 else 0
    confidence = prob if pred_class == 1 else 1 - prob

    if confidence >= 0.9:
        conf_level, conf_color = "RẤT CAO", "#e74c3c"
    elif confidence >= 0.75:
        conf_level, conf_color = "CAO",     "#e67e22"
    elif confidence >= 0.6:
        conf_level, conf_color = "TRUNG BÌNH", "#f39c12"
    else:
        conf_level, conf_color = "THẤP",    "#27ae60"

    clinical = {
        0: {
            "summary":    "Không phát hiện dấu hiệu viêm phổi",
            "detail":     "Hình ảnh phổi trong giới hạn bình thường. "
                          "Không có dấu hiệu đông đặc hay thâm nhiễm.",
            "suggestion": "Tiếp tục theo dõi định kỳ.",
            "risk":       "THẤP"
        },
        1: {
            "summary":    "Phát hiện dấu hiệu nghi ngờ viêm phổi",
            "detail":     "Model phát hiện dấu hiệu bất thường trong vùng phổi. "
                          "Vùng sáng trên Grad-CAM là nơi model tập trung.",
            "suggestion": "Khuyến nghị thăm khám chuyên khoa hô hấp.",
            "risk":       "CAO"
        }
    }

    # Original image → base64
    img_np   = image_tensor.squeeze().detach().numpy()
    img_np   = np.clip(img_np * 0.5 + 0.5, 0, 1)
    orig_pil = Image.fromarray(
        (img_np * 255).astype(np.uint8), mode='L'
    ).resize((224, 224), Image.NEAREST)
    orig_b64 = to_base64(orig_pil)

    # Grad-CAM overlay → base64
    img_rgb = np.stack([img_np]*3, axis=-1)
    heatmap = cv2.applyColorMap(np.uint8(255*cam), cv2.COLORMAP_JET)
    heatmap = cv2.cvtColor(heatmap, cv2.COLOR_BGR2RGB).astype(float) / 255.0
    overlay = np.clip(0.5*img_rgb + 0.5*heatmap, 0, 1)
    overlay_pil = Image.fromarray(
        (overlay*255).astype(np.uint8)
    ).resize((224, 224), Image.NEAREST)
    overlay_b64 = to_base64(overlay_pil)

    return {
        "class_id":         pred_class,
        "class_name":       "Pneumonia" if pred_class == 1 else "Normal",
        "probability": {
            "Normal":       round(float(1 - prob), 4),
            "Pneumonia":    round(float(prob),     4),
        },
        "confidence":       round(float(confidence), 4),
        "confidence_level": conf_level,
        "confidence_color": conf_color,
        "clinical":         clinical[pred_class],
        "original_image":   orig_b64,
        "gradcam_image":    overlay_b64,
    }