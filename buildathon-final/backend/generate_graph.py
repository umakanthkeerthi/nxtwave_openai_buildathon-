import sys
import os

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

try:
    from app.agent.graph import agent_graph
    from app.agent.subgraphs.medical_records import medical_records_graph
    from app.agent.subgraphs.doctor_consultation import doctor_consultation_graph
    
    graphs = {
        "chatbot_agent": agent_graph,
        "medical_records_agent": medical_records_graph,
        "doctor_consultation_agent": doctor_consultation_graph
    }
    
    for name, graph in graphs.items():
        print(f"Generating image for {name}...")
        try:
            png_bytes = graph.get_graph().draw_mermaid_png()
            output_path = f"{name}_architecture.png"
            with open(output_path, "wb") as f:
                f.write(png_bytes)
            print(f"SUCCESS: Saved {output_path}")
        except Exception as e:
            print(f"ERROR for {name}: {e}")

except Exception as main_e:
    print(f"CRITICAL ERROR: {main_e}")
