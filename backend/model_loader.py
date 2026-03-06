import torch
import torch.nn as nn
import pennylane as qml
import os

N_QUBITS_V2 = 8
MODEL_PATH  = os.path.join(os.path.dirname(__file__),
                            'models', 'hqcnn_pneumonia_final.pth')

dev_v2 = qml.device('default.qubit', wires=N_QUBITS_V2)

@qml.qnode(dev_v2, interface='torch')
def hqcnn_v2_circuit(inputs, weights_u3):
    n = N_QUBITS_V2
    qml.AngleEmbedding(inputs, wires=range(n), rotation='Y')
    for i in range(n):
        qml.U3(weights_u3[i,0], weights_u3[i,1], weights_u3[i,2],
               wires=(i+1) % n)
    for i in range(n):
        qml.CNOT(wires=[i, (i+1) % n])
    for i in range(n):
        qml.U3(weights_u3[i,3], weights_u3[i,4], weights_u3[i,5],
               wires=i)
    for i in range(0, n, 2):
        qml.CNOT(wires=[i, (i+2) % n])
    return [qml.expval(qml.PauliZ(i)) for i in range(n)]

qlayer_v2 = qml.qnn.TorchLayer(
    hqcnn_v2_circuit, {"weights_u3": (N_QUBITS_V2, 6)}
)

class HQCNN_V2(nn.Module):
    def __init__(self):
        super().__init__()
        self.features = nn.Sequential(
            nn.Conv2d(1, 16, 3, padding=1),
            nn.BatchNorm2d(16), nn.ReLU(),
            nn.Conv2d(16, 16, 3, padding=1),
            nn.BatchNorm2d(16), nn.ReLU(),
            nn.MaxPool2d(2),
            nn.Conv2d(16, 64, 3, padding=1),
            nn.BatchNorm2d(64), nn.ReLU(),
            nn.Conv2d(64, 64, 3, padding=1),
            nn.BatchNorm2d(64), nn.ReLU(),
            nn.Conv2d(64, 64, 3, padding=1),
            nn.BatchNorm2d(64), nn.ReLU(),
            nn.MaxPool2d(2),
        )
        self.fc1 = nn.Sequential(
            nn.Flatten(),
            nn.Linear(64*7*7, 256), nn.ReLU(),
            nn.Dropout(0.3),
            nn.Linear(256, N_QUBITS_V2),
            nn.Tanh()
        )
        self.quantum = qlayer_v2
        self.fc2 = nn.Sequential(
            nn.Linear(N_QUBITS_V2, 128),
            nn.ReLU(), nn.Dropout(0.2)
        )
        self.fc3 = nn.Sequential(
            nn.Linear(128, 1),
            nn.Sigmoid()
        )

    def forward(self, x):
        x = self.features(x)
        x = self.fc1(x)
        x = self.quantum(x)
        x = self.fc2(x)
        x = self.fc3(x)
        return x

_model = None

def get_model():
    global _model
    if _model is None:
        print(f"📦 Loading model...")
        checkpoint = torch.load(MODEL_PATH, map_location='cpu',
                                 weights_only=False)
        _model = HQCNN_V2()
        _model.load_state_dict(checkpoint['model_state_dict'])
        _model.eval()
        print(f"✅ Model loaded! Acc:{checkpoint.get('test_acc','N/A'):.4f}")
    return _model