<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Roleta de Descontos</title>
    <style>
        .roleta {
            width: 300px;
            height: 300px;
            border: 5px solid #000;
            border-radius: 50%;
            position: relative;
            overflow: hidden;
            margin: 20px auto;
        }
        .seta {
            width: 0; 
            height: 0; 
            border-left: 20px solid transparent;
            border-right: 20px solid transparent;
            border-bottom: 20px solid red;
            position: absolute;
            top: -20px;
            left: calc(50% - 20px);
        }
        .roleta div {
            width: 50%;
            height: 50%;
            position: absolute;
            top: 50%;
            left: 50%;
            transform-origin: 0% 0%;
            background-color: #f0f0f0;
            text-align: center;
            line-height: 150px;
        }
        .roleta div:nth-child(1) { transform: rotate(0deg) skewY(-30deg); }
        .roleta div:nth-child(2) { transform: rotate(72deg) skewY(-30deg); }
        .roleta div:nth-child(3) { transform: rotate(144deg) skewY(-30deg); }
        .roleta div:nth-child(4) { transform: rotate(216deg) skewY(-30deg); }
        .roleta div:nth-child(5) { transform: rotate(288deg) skewY(-30deg); }
        
        .botao-girar {
            display: inline-block;
            padding: 10px 20px;
            font-size: 16px;
            color: #fff;
            background-color: #28a745;
            border: none;
            border-radius: 5px;
            cursor: pointer;
            text-align: center;
            animation: pulsar 1s infinite;
            margin: 20px auto;
            display: block;
        }
        @keyframes pulsar {
            0% { transform: scale(1); }
            50% { transform: scale(1.1); }
            100% { transform: scale(1); }
        }
        
        .oculto {
            display: none;
        }
    </style>
</head>
<body>
    <div class="roleta" id="roleta">
        <div>FRETE GRÁTIS</div>
        <div>10% OFF</div>
        <div>20% OFF</div>
        <div>50% OFF</div>
        <div>1 POTE GRÁTIS</div>
        <div class="seta"></div>
    </div>
    <button class="botao-girar" id="botaoGirar" onclick="girarRoleta()">Girar</button>
    <button class="oculto" id="botaoRedirect" onclick="redirecionar()">Clique aqui para mais ofertas</button>

    <script>
        let tentativas = 2;
        
        function girarRoleta() {
            if (tentativas > 0) {
                const roleta = document.getElementById('roleta');
                const opcoes = [0, 288]; // 0 graus para "FRETE GRÁTIS" e 288 graus para "1 POTE GRÁTIS"
                const randomIndex = Math.floor(Math.random() * opcoes.length);
                const graus = opcoes[randomIndex] + (360 * 4); // 4 voltas completas mais a posição escolhida
                
                roleta.style.transition = 'transform 4s ease-out';
                roleta.style.transform = 'rotate(' + graus + 'deg)';
                
                tentativas--;
                
                if (tentativas === 0) {
                    document.getElementById('botaoGirar').classList.add('oculto');
                    document.getElementById('botaoRedirect').classList.remove('oculto');
                }
            }
        }

        function redirecionar() {
            window.location.href = "https://www.exemplo.com/ofertas"; // Altere para a URL desejada
        }
    </script>
</body>
</html>
